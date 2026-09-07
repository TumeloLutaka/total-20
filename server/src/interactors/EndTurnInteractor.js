// ============================================================ \\
// interactors/EndTurnInteractor.js
// Use case: A player voluntarily ends their turn.
// ============================================================ \\
import { GamePhases, PlayerState } from "../../../Shared/entities/enums.js";
import { resolveSystemEvent } from "./RoundEvaluationInteractor.js";

/**
 * @param {object} action - { type, matchKey }
 * @param {Game} game
 * @param {Function} emit - fn(event, matchKey)
 * @returns {"MATCH_END" | undefined}
 */
export function endTurn(action, game, emit) {
  const currentPlayer = game.getCurrentPlayer();

  // Player bust — opponent wins the round immediately
  if (currentPlayer.state === PlayerState.LOSS) {
    action.type = "ROUND_WON";
    return resolveSystemEvent(action, game, emit);
  }

  game.changePhase(GamePhases.END);

  emit(
    {
      type: "END_TURN",
      payload: { phase: game.phase, playerNumber: currentPlayer.playerNumber },
    },
    action.matchKey,
  );

  action.type = "NEXT_TURN";
  resolveSystemEvent(action, game, emit);
}
