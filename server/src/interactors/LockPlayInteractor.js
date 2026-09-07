// ============================================================ \\
// interactors/LockPlayInteractor.js
// Use case: A player locks in their current score.
// ============================================================ \\
import { PlayerState } from "../../../Shared/entities/enums.js";
import { resolveSystemEvent } from "./RoundEvaluationInteractor.js";

/**
 * @param {object} action - { type, matchKey }
 * @param {Game} game
 * @param {Function} emit - fn(event, matchKey)
 * @returns {"MATCH_END" | undefined}
 */
export function lockPlay(action, game, emit) {
  const currentPlayer = game.getCurrentPlayer();

  // Player bust — opponent wins the round immediately
  if (currentPlayer.state === PlayerState.LOSS) {
    action.type = "ROUND_WON";
    return resolveSystemEvent(action, game, emit);
  }

  // Lock the player in
  currentPlayer.state = PlayerState.LOCK;

  emit(
    {
      type: "LOCK_PLAY",
      payload: { currentPlayerNumber: currentPlayer.playerNumber },
    },
    action.matchKey,
  );

  // Check if this lock triggers an immediate round resolution
  const lockResolution = game.evaluateLock();
  if (lockResolution) {
    action.type = lockResolution;
    return resolveSystemEvent(action, game, emit);
  }

  // Otherwise auto-end this player's turn so the opponent can play
  action.type = "AUTO_END";
  resolveSystemEvent(action, game, emit);
}
