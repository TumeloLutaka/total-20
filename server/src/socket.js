import { SocketEvents } from "../../client/shared/socketEvents.js";

let io = null;

export const socketHandler = (_io, gameManager) => {
  io = _io;

  io.on("connection", (socket) => {
    console.log("A user connected", socket.id);
    io.to(socket.id).emit(SocketEvents.S2C.PRIVATE_MESSAGE, "Hello User!");
    io.to(socket.id).emit(SocketEvents.S2C.GIVE_ID);

    // ====== CLIENT TO SERVER EMIT ====== /
    lobbyHandler(io, socket, gameManager);

    // ====== SERVER TO CLIENT EMIT ====== /
    gameHandler(io, socket, gameManager);

    socket.on("disconnect", () => {
      console.log("user disconnected");
    });
  });
};

function lobbyHandler(io, socket, gameManager) {
  socket.on(SocketEvents.C2S.JOIN_ROOM, (roomId) => {
    const count = io.of("/").adapter.rooms.get(roomId)?.size || 0;

    // First player: Create new game
    if (count === 0) {
      socket.join(roomId);
      gameManager.createGame(roomId);
      return;
    }

    // Second player: Start the game
    if (count === 1) {
      socket.join(roomId);
      console.log("Joining Room: " + roomId);
      io.to(roomId).emit(SocketEvents.S2C.GAME_START, roomId);
      return;
    }

    // Default: Room is full (shouldn't happen, but safety net)
    io.to(socket.id).emit(
      SocketEvents.S2C.PRIVATE_MESSAGE,
      `Room ${roomId} is full!`
    );
  });
}

function gameHandler(io, socket, gameManager) {
  socket.on(SocketEvents.C2S.GET_GAME, (userData) => {
    // Join player to game room
    socket.join(userData.roomId);

    const gameState = gameManager.getGame(userData.roomId);
    gameState.addPlayer(userData.username, socket.id);

    // Find game related to room
    if (gameState.players.length === 2) {
      gameState.actionStream.push({
        roomId: userData.roomId,
        action: "start_game",
      });

      parseActionStream(io, gameState);
    }
  });

  socket.on(SocketEvents.C2S.ACTION_STREAM, (actionData) => {
    // Get game state associated with room
    const gameState = gameManager.getGame(actionData.roomId);

    // Don't process any actions if the game is done.
    if (gameState.status === "Game Over") return;

    // Check if the player making the call is on their turn
    if (gameState.currentPlayer !== actionData.playerIndex) return;

    // Add an action to the game state action stream. This action will be shared to all players.
    gameState.actionStream.push(actionData);
    parseActionStream(io, gameState);
  });
}

// ========== FUNCTIONS ========== \\
function parseActionStream(io, gameState) {
  // Get action data
  const actionData = gameState.actionStream[gameState.actionStream.length - 1];
  if (!actionData) return; // Exit if the stream is empty

  const activePlayer = gameState.players[actionData.playerIndex];

  let sendGameState = true;

  switch (actionData.action) {
    case "add_score": // Trigger: Player draws cards. Player plays card.
      // Get player
      const activeCard =
        actionData.caller === "server"
          ? actionData.drawnCard
          : activePlayer.hand[actionData.cardIndex];

      // Change player score based on provided amount.
      let multipler = activeCard.type === "red" ? -1 : 1;
      activePlayer.score += activeCard.number * multipler;

      // Check who called the add functionality to determine where the top card will change
      if (actionData.caller === "server") {
        // Set the gameboard top card to newly drawn card
        gameState.gameBoard.topCard = activeCard.number;
      } else if (actionData.caller === "player") {
        // Set the player top card to newly drawn card
        activePlayer.topCard = activeCard.number;

        // Filter out the drawn card from the player's hand.
        activePlayer.hand = activePlayer.hand.filter((card, index) => {
          return index !== actionData.cardIndex;
        });
      }

      // Auto stand player if they hit 20
      if (activePlayer.score === 20) {
        gameState.actionStream.push({
          ...actionData,
          action: "stand_user",
        });

        sendGameState = false;
        parseActionStream(io, gameState);
        break;
      }

      // Set next phase info
      gameState.status = actionData.nextPhase;
      break;
    case "draw_card":
      // Validation: Must be their turn and they haven't drawn/played yet
      if (activePlayer.hasDrawn) {
        sendGameState = false;
        break;
      }

      activePlayer.hasDrawn = true; // Lock drawing for this turn.
      gameState.status = actionData.nextPhase;

      const random = Math.floor(Math.random() * 10) + 1;
      gameState.actionStream.push({
        ...actionData,
        action: "add_score",
        drawnCard: { number: random, type: "purple" },
        nextPhase: "Playing", // Stay in playing phase so they can choose to play a card
        caller: "server",
      });
      parseActionStream(io, gameState);
      sendGameState = false;
      break;
    case "end_turn": // Trigger: Player ends turn. Player stands.
      // Reset flags for the player who just finished
      activePlayer.hasDrawn = false;
      activePlayer.hasPlayed = false;

      // Checking for win conditions.
      evaluateRound(gameState);

      // Switch active player
      gameState.currentPlayer = gameState.currentPlayer === 0 ? 1 : 0;
      if (gameState.status !== "Game Over")
        gameState.status = actionData.nextPhase;
      break;
    case "play_card":
      if (!activePlayer.hasDrawn || activePlayer.hasPlayed) {
        sendGameState = false;
        break;
      }

      activePlayer.hasPlayed = true; // Lock play for this turn

      gameState.actionStream.push({
        ...actionData,
        action: "add_score",
        nextPhase: "End Phase", // Move to end phase automatically after playing
        caller: "player",
      });
      parseActionStream(io, gameState);
      sendGameState = false;
      break;
    case "stand_user": // Tiggers: Stand Button. When player hits 20.
      gameState.players[actionData.playerIndex].hasStood = true;
      const actionStreamData = {
        ...actionData,
        action: "end_turn",
        nextPhase: "End Phase",
      };
      gameState.actionStream.push(actionStreamData);
      parseActionStream(io, gameState);
      sendGameState = false;
      break;
    case "start_game":
      gameState.status = "Waiting";
      break;
    default:
      console.log("Parse action stream Switch failed.");
  }

  sendGameStateToPlayers(io, gameState);

  function sendGameStateToPlayers(io, gameState) {
    const [player1, player2] = gameState.players;

    const player1Socket = player1.socketId;
    const player2Socket = player2.socketId;

    const p1Data = {
      ...gameState,
      players: [
        { ...player1 },
        { ...player2, hand: null, handCount: player2.hand.length },
      ],
    };

    const p2Data = {
      ...gameState,
      players: [
        { ...player1, hand: null, handCount: player1.hand.length },
        { ...player2 },
      ],
    };

    io.to(player1Socket).emit(SocketEvents.S2C.SEND_GAME_STATE, p1Data);
    io.to(player2Socket).emit(SocketEvents.S2C.SEND_GAME_STATE, p2Data);
  }

  function evaluateRound(gameState) {
    // Get the current player
    const [player1, player2] = gameState.players;

    const resolveSet = (winner) => {
      if (winner) {
        winner.points += 1;

        if (winner.points === 2) {
          gameState.status = "Game Over";
          gameState.winner = winner.name;
          return; // Stop here, don't reset for a new set
        }
      }

      // Reset for next set
      player1.score = 0;
      player2.score = 0;
      player1.hasStood = false;
      player2.hasStood = false;
      player1.topCard = null;
      player2.topCard = null;
      gameState.round++;
    };

    // 1. Check for busts
    if (player1.score > 20) return resolveSet(player2);
    if (player2.score > 20) return resolveSet(player1);

    // 2. Both Stood? Compare scores.
    if (player1.hasStood && player2.hasStood) {
      if (player1.score > player2.score) resolveSet(player1);
      else if (player2.score > player1.score) resolveSet(player2);
      else resolveSet(null);
    }
  }
}
