// ============================================================ \\
// interactors/PlayCardInteractor.js
// Use case: A player plays a card from their hand onto their pile.
// ============================================================ \\
import { GamePhases, PlayerState } from "../../../Shared/entities/enums.js";
import { resolveSystemEvent } from "./RoundEvaluationInteractor.js";

/**
 * @param {object} action - { type, matchKey, data: { cardId } }
 * @param {Game} game
 * @param {Function} emit - fn(event, matchKey) — broadcasts to the room
 * @param {Function} emitToSocket - fn(socketId, event) — sends to one player
 */
export function playCard(action, game, emit, emitToSocket) {
  const currentPlayer = game.getCurrentPlayer();
  const opponent = game.getOpponentFromSocketId(currentPlayer.socketId);

  const playedCard = game.playCard(action.data.cardId);
  game.changePhase(GamePhases.LOCK);

  const { playerNumber, hand, score } = currentPlayer;

  // The acting player receives their full hand (with card values)
  emitToSocket(currentPlayer.socketId, {
    type: "PLAY_CARD",
    payload: {
      hand,
      newScoreTotal: score,
      phase: game.phase,
      playedCard,
      playerNumber,
      state: currentPlayer.state,
    },
  });

  // The opponent only receives card IDs (no peeking at values)
  emitToSocket(opponent.socketId, {
    type: "PLAY_CARD",
    payload: {
      hand: currentPlayer.getHandIds(),
      newScoreTotal: score,
      phase: game.phase,
      playedCard,
      playerNumber,
      state: currentPlayer.state,
    },
  });

  // Playing to exactly 20 auto-locks the player
  if (currentPlayer.state === PlayerState.LOCK) {
    action.type = "AUTO_LOCK";
    resolveSystemEvent(action, game, emit);
  }
}
