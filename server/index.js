// ======================================================== \\
// THIRD PARTY IMPORTS
// ======================================================== \\
import "dotenv/config";

import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

// ======================================================== \\
// CUSTOM IMPORTS
// ======================================================== \\
import database from "./src/database.js";
import { GamePhases, PlayerState } from "../Shared/enums.js";

const app = express();
app.use(cors());
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL;

const io = new Server(server, {
  cors: {
    origin: [CLIENT_URL],
    method: ["GET", "POST"],
  },
});

io.on("connection", async (socket) => {
  console.log("connection: " + socket.id);
  const user = await database.addUser({ socketId: socket.id });
  await cleanupStaleState();
  socket.emit("user-data", { user });

  const users = await database.getUsers();

  io.emit("update_users", {
    users,
  });

  socket.on("disconnect", async () => {
    console.log("Disconnecting: ", socket.id);
    await cleanupStaleState();
  });

  socket.on("get-user-data", async () => {
    // Retrieve the user object linked to this socket instance
    const currentUser = await database.getUser(socket.id);

    if (currentUser) {
      socket.emit("user-data", { user: currentUser });
    }
  });

  matchHandler(socket);

  gameHandler(socket);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log("Server is running on port: " + PORT);
});

// ======================================================== \\
// FUNCTIONS
// ======================================================== \\
async function cleanupStaleState() {
  const activeSocketIds = new Set(io.sockets.sockets.keys());

  await database.cleanupStaleUsers(activeSocketIds);
  await database.cleanupStaleMatches(activeSocketIds);
}

async function cleanupMatch(matchKey) {
  const room = io.sockets.adapter.rooms.get(matchKey);

  if (room) {
    for (const socketId of room) {
      const s = io.sockets.sockets.get(socketId);
      if (s) s.leave(matchKey);
    }
  }

  await database.deleteMatch(matchKey);

  const users = await database.getUsers();
  const rooms = await database.getMatches();

  io.emit("update_users", {
    rooms,
    users,
  });
}

function dualEmit(event, matchKey) {
  if (event === null) {
    io.to(matchKey).emit("match-error", "Event creation error");
    return;
  }
  io.to(matchKey).emit("game-event", event);
}

function gameHandler(socket) {
  socket.on("init-game", async (matchKey) => {
    // Get match the player belongs to.
    try {
      const match = await database.getMatch(matchKey);
      const game = match.game;
      const opponent = game.getOpponentFromSocketId(socket.id);

      // Create event
      const event = {
        type: "GAME_INIT",
        payload: {
          opponent: {
            userName: opponent.userName,
            hand: opponent.getHandIds(),
          },
          player: game.getPlayerFromSocketId(socket.id),
          phase: game.phase,
        },
      };

      // Send card hands
      socket.emit("game-event", event);
    } catch (error) {
      console.error(error.message);
      socket.emit("match-error", error.message);
    }
  });

  socket.on("player-action", async ({ action, data }) => {
    const match = await database.getMatch(action.matchKey);
    const game = match.game;

    // Check if the player is allowed to send an event.
    if (!game.isPlayerTurn(socket.id)) return;

    await playerTriggedEventActionHandling(action, data, game, socket);

    await database.saveMatch(action.matchKey, match);
  });
}

function matchHandler(socket) {
  socket.on("create_match", async () => {
    const matchKey = await database.createMatch(socket.id);
    socket.join(matchKey);
    socket.emit("match-created", matchKey);

    io.emit("update_users", {
      rooms: await database.getMatches(),
      users: await database.getUsers(),
    });
  });

  socket.on("leave-match", async ({ matchKey }) => {
    console.log("LEAVING MATCH");

    const match = await database.getMatch(matchKey);
    if (!match) return;

    // Notify the opponent
    socket.to(matchKey).emit("game-event", {
      type: "OPPONENT_LEFT",
      payload: { matchKey },
    });

    socket.leave(matchKey);
    setTimeout(async () => await cleanupMatch(matchKey), 3000);
  });

  socket.on("join-match", async (matchKey) => {
    // Clean up the input key
    const cleanKey = matchKey.trim().toUpperCase();
    //Check if room actually exists/has active users
    const room = io.sockets.adapter.rooms.get(cleanKey);

    if (!room) {
      return socket.emit("match-error", "Match Not Found");
    }

    // CRITICAL FOR 1v1: check room capacity
    if (room.size >= 2) {
      return socket.emit("match-error", "This match is already full!");
    }

    socket.join(cleanKey);
    socket.emit("match-joined", { matchKey, playerNumber: 2 });

    await database.joinMatch(cleanKey, socket.id);

    // Tell both players teh match is ready to start!
    io.to(cleanKey).emit("match-ready", {
      message: "Both players connected.",
      matchKey: cleanKey,
    });
  });
}

async function playerTriggedEventActionHandling(action, data, game, socket) {
  let event = null;
  const currentPlayer = game.getCurrentPlayer();

  // Evaluate player action and perform function accordinly.
  switch (action.type) {
    case "DRAW_CARD": {
      // Mutate game.
      const drawnCard = game.drawCard();
      game.changePhase(GamePhases.DRAW);

      // Send mutated data
      event = {
        type: "DRAW_CARD",
        payload: {
          drawnCard: drawnCard,
          newScoreTotal: currentPlayer.score,
          phase: game.phase,
          playerNumber: currentPlayer.playerNumber,
          state: currentPlayer.state,
        },
      };

      dualEmit(event, action.matchKey);

      // Check player state to see if they are locked (hitting a score of 20 locks automatically)
      if (currentPlayer.state === PlayerState.LOCK) {
        action.type = "AUTO_LOCK";
        systemTriggeredEventActionHandling(action, game);
        break;
      }

      action.type = "PLAY_TURN";
      systemTriggeredEventActionHandling(action, game);
      break;
    }

    case "END_TURN": {
      // Evaluate player to see if they are in a losing state.
      if (currentPlayer.state == PlayerState.LOSS) {
        action.type = "ROUND_WON";
        systemTriggeredEventActionHandling(action, game);
        break;
      }

      // CHECK FOR WIN CONDITIONS IN FUTURE.
      game.changePhase(GamePhases.END);

      event = {
        type: "END_TURN",
        payload: {
          phase: game.phase,
          playerNumber: currentPlayer.playerNumber,
        },
      };

      dualEmit(event, action.matchKey);

      action.type = "NEXT_TURN";
      systemTriggeredEventActionHandling(action, game);
      break;
    }

    case "LOCK_PLAY": {
      // Evaluate player to see if they are in a losing state.
      if (currentPlayer.state == PlayerState.LOSS) {
        action.type = "ROUND_WON";
        systemTriggeredEventActionHandling(action, game);
        break;
      }

      // Player Locks themselves.If they reach this part of the code it means they haven't lost yet.
      // Get player and changer their state.
      currentPlayer.state = PlayerState.LOCK;
      // End their turn.
      event = {
        type: action.type,
        payload: {
          currentPlayerNumber: currentPlayer.playerNumber,
        },
      };

      dualEmit(event, action.matchKey);

      const resolution = game.evaluateLock();
      if (resolution) {
        action.type = resolution;
        systemTriggeredEventActionHandling(action, game);
        break;
      }

      action.type = "AUTO_END";
      systemTriggeredEventActionHandling(action, game);
      break;
    }

    case "PLAY_CARD": {
      // Play and remove card from
      const playedCard = game.playCard(data.cardId);
      const opponent = game.getOpponentFromSocketId(socket.id);
      game.changePhase(GamePhases.LOCK);

      const {
        playerNumber,
        hand,
        points,
        score,
        socketId: currentPlayerSocket,
      } = currentPlayer;

      // Send full hand to the player who acted
      socket.emit("game-event", {
        type: "PLAY_CARD",
        payload: {
          hand: hand,
          newScoreTotal: score,
          phase: game.phase,
          playedCard,
          playerNumber,
          state: currentPlayer.state,
        },
      });

      // Send only card Ids to opponent
      socket.to(opponent.socketId).emit("game-event", {
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

      // Check player state to see if they are locked (hitting a score of 20 locks automatically)
      if (currentPlayer.state === PlayerState.LOCK) {
        action.type = "AUTO_LOCK";
        systemTriggeredEventActionHandling(action, game);
        break;
      }

      break;
    }
  }
}

function systemTriggeredEventActionHandling(action, game) {
  // In case action type was altered during player action.
  // These are system triggered actions
  const currentPlayer = game.getCurrentPlayer();
  let event = null;

  switch (action.type) {
    case "AUTO_END": {
      game.changePhase(GamePhases.END);

      event = {
        type: "AUTO_END_TURN",
        payload: {
          phase: game.phase,
          playerNumber: currentPlayer.playerNumber,
        },
      };

      dualEmit(event, action.matchKey);

      action.type = "NEXT_TURN";
      systemTriggeredEventActionHandling(action, game);
      break;
    }

    case "AUTO_LOCK": {
      event = {
        type: "AUTO_LOCK_PLAY",
        payload: {
          currentPlayerNumber: currentPlayer.playerNumber,
          phase: GamePhases.AUTO_LOCK,
        },
      };

      dualEmit(event, action.matchKey);

      const resolution = game.evaluateLock();
      if (resolution) {
        action.type = resolution;
        systemTriggeredEventActionHandling(action, game);
        break;
      }

      action.type = "AUTO_END";
      systemTriggeredEventActionHandling(action, game);
      break;
    }

    case "NEXT_TURN": {
      game.changeCurrentPlayer();
      game.changePhase(GamePhases.NEXT);

      const nextPlayer = game.getCurrentPlayer();

      event = {
        type: action.type,
        payload: {
          currentPlayerNumber: nextPlayer.playerNumber,
          phase: game.phase,
        },
      };

      dualEmit(event, action.matchKey);

      // Catch dual-lock before entering AUTO_END chain
      if (
        game.player1.state === PlayerState.LOCK &&
        game.player2.state === PlayerState.LOCK
      ) {
        action.type = game.evaluateLock(); // ROUND_WON or DRAW_ROUND
        systemTriggeredEventActionHandling(action, game);
        break;
      }

      // Check if the new current player is already locked. Auto end their turn.
      if (nextPlayer.state === PlayerState.LOCK) {
        game.changePhase(GamePhases.AUTO_PLAY);

        event = {
          type: "AUTO_PLAY",
          payload: {
            phase: game.phase,
          },
        };

        dualEmit(event, action.matchKey);
        action.type = "AUTO_END";
        systemTriggeredEventActionHandling(action, game);
        break;
      }

      break;
    }

    case "PLAY_TURN": {
      event = {
        type: "PLAY_TURN",
        payload: {
          phase: GamePhases.PLAY,
        },
      };

      dualEmit(event, action.matchKey);
      break;
    }

    case "ROUND_WON": {
      // Award points checks for a player with a loss state gets the opposing player
      // The opposing player is awarded a point and returned.
      const winner = game.awardPoint();

      event = {
        type: "ROUND_WON",
        payload: {
          newPointsTotal: winner.points,
          playerNumber: winner.playerNumber,
        },
      };

      dualEmit(event, action.matchKey);

      if (winner.points >= 2) {
        // Match end.
        event = {
          type: "MATCH_END",
          payload: {},
        };

        dualEmit(event, action.matchKey);

        // Schdeula cleanup after clients have time to recieve the event
        setTimeout(async () => await cleanupMatch(action.matchKey), 3000);
        break;
      }

      // Reset scores for new round
      try {
        game.resetRound();
        event = { type: "ROUND_END", payload: { phase: GamePhases.NEXT } };
        dualEmit(event, action.matchKey);
      } catch (err) {
        console.error("Error in ROUND_END block:", err);
      }

      break;
    }

    case "TIE_ROUND": {
      game.changePhase(GamePhases.TIE);

      event = {
        type: "TIE_ROUND",
        payload: {
          phase: game.phase,
        },
      };
      dualEmit(event, action.matchKey);

      game.resetRound();
      game.changePhase(GamePhases.NEXT);
      event = { type: "ROUND_END", payload: { phase: game.phase } };
      dualEmit(event, action.matchKey);

      break;
    }
  }
}
