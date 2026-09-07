// ============================================================ \\
// entities/gameState.js
// Defines the shape of the client-side game state.
// This is the source of truth for what a game "looks like"
// to the client � making the data model visible at a glance.
// ============================================================ \\
import { GamePhases, PlayerState } from "../../../Shared/entities/enums.js";

/**
 * The initial game state � used before the server sends GAME_INIT.
 * @type {import("./gameStateTypes").GameState}
 */
export const initialGameState = {
  currentPlayerNumber: 1,
  gameOverReason: null,
  opponent: {
    hand: [],
    pileTopCard: null,
    playerNumber: null,
    points: 0,
    score: 0,
    state: PlayerState.LIVE,
    userName: "loading...",
  },
  phase: GamePhases.INIT,
  player: null,
  playerNumber: 1,
};
