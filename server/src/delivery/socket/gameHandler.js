// ============================================================ \\
// delivery/socket/gameHandler.js
// Boundary: handles all in-game socket events.
// Delegates all business logic to the interactors.
// ============================================================ \\
import { drawCard } from "../../interactors/DrawCardInteractor.js";
import { endTurn } from "../../interactors/EndTurnInteractor.js";
import { lockPlay } from "../../interactors/LockPlayInteractor.js";
import { playCard } from "../../interactors/PlayCardInteractor.js";

/**
 * @param {import("socket.io").Socket} socket
 * @param {import("socket.io").Server} io
 * @param {object} database
 * @param {Function} cleanupMatch - async fn(matchKey)
 */
export function gameHandler(socket, io, database, cleanupMatch) {
  /** Broadcasts a game event to every socket in the match room. */
  const emit = (event, matchKey) => {
    if (event === null) {
      io.to(matchKey).emit("match-error", "Event creation error");
      return;
    }
    io.to(matchKey).emit("game-event", event);
  };

  /** Sends a game event to a single socket by its ID. */
  const emitToSocket = (socketId, event) => {
    io.to(socketId).emit("game-event", event);
  };

  socket.on("init-game", async (matchKey) => {
    try {
      const match = await database.getMatch(matchKey);
      const game = match.game;
      const opponent = game.getOpponentFromSocketId(socket.id);

      socket.emit("game-event", {
        type: "GAME_INIT",
        payload: {
          opponent: {
            userName: opponent.userName,
            hand: opponent.getHandIds(),
          },
          player: game.getPlayerFromSocketId(socket.id),
          phase: game.phase,
        },
      });
    } catch (error) {
      console.error(error.message);
      socket.emit("match-error", error.message);
    }
  });

  socket.on("player-action", async ({ action, data }) => {
    const match = await database.getMatch(action.matchKey);
    const game = match.game;

    // Only the current player may act
    if (!game.isPlayerTurn(socket.id)) return;

    // Attach data to action for interactors that need it (e.g. PLAY_CARD)
    action.data = data;

    let matchEnded = false;

    switch (action.type) {
      case "DRAW_CARD":
        drawCard(action, game, emit);
        break;

      case "END_TURN": {
        const result = endTurn(action, game, emit);
        if (result === "MATCH_END") matchEnded = true;
        break;
      }

      case "LOCK_PLAY": {
        const result = lockPlay(action, game, emit);
        if (result === "MATCH_END") matchEnded = true;
        break;
      }

      case "PLAY_CARD":
        playCard(action, game, emit, emitToSocket);
        break;
    }

    if (!matchEnded) {
      await database.saveMatch(action.matchKey, match);
    } else {
      // Give clients time to receive the MATCH_END event before we clean up
      setTimeout(async () => await cleanupMatch(action.matchKey), 3000);
    }
  });
}
