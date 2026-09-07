// ============================================================ \\
// interactors/DrawCardInteractor.js
// Use case: A player draws a card from the deck.
// ============================================================ \\
import { GamePhases, PlayerState } from "../../../Shared/entities/enums.js";
import { resolveSystemEvent } from "./RoundEvaluationInteractor.js";

/**
 * @param {object} action - { type, matchKey }
 * @param {Game} game
 * @param {Function} emit - fn(event, matchKey)
 */
export function drawCard(action, game, emit) {
  const drawnCard = game.drawCard();
  game.changePhase(GamePhases.DRAW);

  const currentPlayer = game.getCurrentPlayer();

  emit(
    {
      type: "DRAW_CARD",
      payload: {
        drawnCard,
        newScoreTotal: currentPlayer.score,
        phase: game.phase,
        playerNumber: currentPlayer.playerNumber,
        state: currentPlayer.state,
      },
    },
    action.matchKey,
  );

  // Drawing to exactly 20 auto-locks the player
  if (currentPlayer.state === PlayerState.LOCK) {
    action.type = "AUTO_LOCK";
    resolveSystemEvent(action, game, emit);
    return;
  }

  action.type = "PLAY_TURN";
  resolveSystemEvent(action, game, emit);
}
