// ============================================================ \\
// interactors/gameEventProcessor.js
// Use case: Process a single game event received from the server
// and apply the resulting state mutation.
//
// This is pure logic � no React, no socket, no UI.
// It takes the current state via the React setter and returns
// the next state, making it trivially unit-testable.
// ============================================================ \\
import { GamePhases, PlayerState } from "../../../Shared/entities/enums.js";

/**
 * Applies a server game-event to the client game state.
 *
 * @param {object} event - The raw event from the server { type, payload }
 * @param {number} playerNumber - This client player's player number
 * @param {Function} setGameState - React state setter
 */
export function processGameEvent(event, playerNumber, setGameState) {
  const payload = event.payload;

  switch (event.type) {
    case "AUTO_PLAY": {
      setGameState((prev) => ({ ...prev, phase: payload.phase }));
      break;
    }

    case "DRAW_CARD": {
      setGameState((prev) => {
        const key =
          prev.player?.playerNumber === payload.playerNumber
            ? "player"
            : "opponent";

        return {
          ...prev,
          [key]: {
            ...prev[key],
            score: payload.newScoreTotal,
            pileTopCard: payload.drawnCard,
            state: payload.state,
          },
          phase: payload.phase,
        };
      });
      break;
    }

    case "END_TURN":
    case "AUTO_END_TURN": {
      setGameState((prev) => ({ ...prev, phase: payload.phase }));
      break;
    }

    case "GAME_INIT": {
      setGameState((prev) => ({
        ...prev,
        opponent: {
          ...prev.opponent,
          hand: payload.opponent.hand,
          playerNumber: playerNumber === 1 ? 2 : 1,
          userName: payload.opponent.userName,
        },
        phase: payload.phase,
        player: payload.player,
      }));
      break;
    }

    case "LOCK_PLAY":
    case "AUTO_LOCK_PLAY": {
      setGameState((prev) => {
        const key =
          prev.player?.playerNumber === payload.currentPlayerNumber
            ? "player"
            : "opponent";

        return {
          ...prev,
          [key]: { ...prev[key], state: PlayerState.LOCK },
        };
      });
      break;
    }

    case "MATCH_END": {
      setGameState((prev) => ({
        ...prev,
        gameOverReason: "match_end",
        phase: GamePhases.OVER,
      }));
      break;
    }

    case "NEXT_TURN": {
      setGameState((prev) => ({
        ...prev,
        currentPlayerNumber: payload.currentPlayerNumber,
        phase: payload.phase,
      }));
      break;
    }

    case "OPPONENT_DISCONNECTED":
    case "OPPONENT_LEFT": {
      setGameState((prev) => ({
        ...prev,
        gameOverReason: "opponent_left",
        phase: GamePhases.OVER,
      }));
      break;
    }

    case "PLAY_CARD": {
      setGameState((prev) => {
        const key =
          prev.player?.playerNumber === payload.playerNumber
            ? "player"
            : "opponent";

        return {
          ...prev,
          [key]: {
            ...prev[key],
            hand: payload.hand,
            pileTopCard: payload.playedCard,
            score: payload.newScoreTotal,
            state: payload.state,
          },
          phase: payload.phase,
        };
      });
      break;
    }

    case "PLAY_TURN": {
      setGameState((prev) => ({ ...prev, phase: payload.phase }));
      break;
    }

    case "ROUND_END": {
      setGameState((prev) => ({
        ...prev,
        opponent: { ...prev.opponent, score: 0, state: PlayerState.LIVE },
        player: { ...prev.player, score: 0, state: PlayerState.LIVE },
        phase: payload.phase,
      }));
      break;
    }

    case "ROUND_WON": {
      setGameState((prev) => {
        const key =
          prev.player?.playerNumber === payload.playerNumber
            ? "player"
            : "opponent";

        return {
          ...prev,
          [key]: { ...prev[key], points: payload.newPointsTotal },
        };
      });
      break;
    }

    case "TIE_ROUND": {
      setGameState((prev) => ({ ...prev, phase: payload.phase }));
      break;
    }
  }
}
