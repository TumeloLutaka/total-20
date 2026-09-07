// ============================================================ \\
// interactors/RoundEvaluationInteractor.js
// Handles all system-triggered game events:
// auto-lock, auto-end, next-turn, round-won, tie-round.
// Called after player actions resolve, never directly by a player.
// ============================================================ \\
import { GamePhases, PlayerState } from "../../../Shared/entities/enums.js";

/**
 * @param {object} action - { type, matchKey }
 * @param {Game} game
 * @param {Function} emit - fn(event, matchKey) — broadcasts to the match room
 */
export function resolveSystemEvent(action, game, emit) {
  const currentPlayer = game.getCurrentPlayer();

  switch (action.type) {
    case "AUTO_END": {
      game.changePhase(GamePhases.END);

      emit(
        {
          type: "AUTO_END_TURN",
          payload: { phase: game.phase, playerNumber: currentPlayer.playerNumber },
        },
        action.matchKey,
      );

      action.type = "NEXT_TURN";
      resolveSystemEvent(action, game, emit);
      break;
    }

    case "AUTO_LOCK": {
      emit(
        {
          type: "AUTO_LOCK_PLAY",
          payload: {
            currentPlayerNumber: currentPlayer.playerNumber,
            phase: GamePhases.AUTO_LOCK,
          },
        },
        action.matchKey,
      );

      const lockResolution = game.evaluateLock();
      if (lockResolution) {
        action.type = lockResolution;
        resolveSystemEvent(action, game, emit);
        break;
      }

      action.type = "AUTO_END";
      resolveSystemEvent(action, game, emit);
      break;
    }

    case "NEXT_TURN": {
      game.changeCurrentPlayer();
      game.changePhase(GamePhases.NEXT);

      const nextPlayer = game.getCurrentPlayer();

      emit(
        {
          type: "NEXT_TURN",
          payload: { currentPlayerNumber: nextPlayer.playerNumber, phase: game.phase },
        },
        action.matchKey,
      );

      // Both players locked — resolve immediately
      if (
        game.player1.state === PlayerState.LOCK &&
        game.player2.state === PlayerState.LOCK
      ) {
        action.type = game.evaluateLock(); // "ROUND_WON" or "TIE_ROUND"
        resolveSystemEvent(action, game, emit);
        break;
      }

      // New current player is already locked — auto-play their turn
      if (nextPlayer.state === PlayerState.LOCK) {
        game.changePhase(GamePhases.AUTO_PLAY);

        emit(
          { type: "AUTO_PLAY", payload: { phase: game.phase } },
          action.matchKey,
        );

        action.type = "AUTO_END";
        resolveSystemEvent(action, game, emit);
      }

      break;
    }

    case "PLAY_TURN": {
      emit(
        { type: "PLAY_TURN", payload: { phase: GamePhases.PLAY } },
        action.matchKey,
      );
      break;
    }

    case "ROUND_WON": {
      const winner = game.awardPoint();

      emit(
        {
          type: "ROUND_WON",
          payload: { newPointsTotal: winner.points, playerNumber: winner.playerNumber },
        },
        action.matchKey,
      );

      if (winner.points >= 2) {
        emit({ type: "MATCH_END", payload: {} }, action.matchKey);
        return "MATCH_END"; // Signal to caller that cleanup is needed
      }

      // Reset scores for a new round
      game.resetRound();
      emit(
        { type: "ROUND_END", payload: { phase: GamePhases.NEXT } },
        action.matchKey,
      );
      break;
    }

    case "TIE_ROUND": {
      game.changePhase(GamePhases.TIE);

      emit(
        { type: "TIE_ROUND", payload: { phase: game.phase } },
        action.matchKey,
      );

      game.resetRound();
      game.changePhase(GamePhases.NEXT);

      emit(
        { type: "ROUND_END", payload: { phase: game.phase } },
        action.matchKey,
      );
      break;
    }
  }
}
