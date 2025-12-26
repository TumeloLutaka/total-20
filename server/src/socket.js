import { SocketEvents } from "../../client/shared/socketEvents.js";

let io = null

export const socketHandler = (_io, gameManager) => {
  io = _io

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
    gameState.addPlayer(userData.username);

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

    // Check if the player making the call is on their turn
    if (gameState.currentPlayer !== actionData.playerIndex) return;

    // Add an action to the game state action stream. This action will be shared to all players.
    gameState.actionStream.push(actionData);
    parseActionStream(io, gameState);
  });
}

function evaluateRound(gameState) {
  // Get the current player
  const [player1, player2] = gameState.players;
  const currentPlayer = gameState.players[gameState.currentPlayer];

  // Check if both players have are at 20
  if (currentPlayer.score === 20) currentPlayer.hasStood = true;

  if (!player1.hasStood || !player2.hasStood) return;

  const scoreDifference = player1.score - player2.score;

  if (scoreDifference === 0) {
    // draw
  } else if (scoreDifference > 0) {
    // player 1 wins
  } else {
    // player 2 wins
  }
}

function parseActionStream(io, gameState) {
  // Get action data
  const actionData = gameState.actionStream[gameState.actionStream.length - 1];

  let sendGameState = true;

  switch (actionData.action) {
    case "add_score":
      // Change player score based on provided amount.
      gameState.players[actionData.playerIndex].score += actionData.increaseAmount;

      // Set next phase info
      gameState.status = actionData.nextPhase;

      // Check who called the add functionality to determine where the top card will change
      if (actionData.caller === "server")
        gameState.gameBoard.topCard = actionData.increaseAmount;
      else
        gameState.players[actionData.playerIndex].topCard =
          actionData.increaseAmount;

      evaluateRound(gameState);
      break;
    case "draw_card":
      gameState.status = actionData.nextPhase;
      const random = Math.floor(Math.random() * 10) + 1;
      gameState.actionStream.push({
        ...actionData,
        action: "add_score",
        increaseAmount: random,
        nextPhase: "Playing",
        caller: "server",
      });
      parseActionStream(io, gameState);
      sendGameState = false;
      break;
    case "end_turn":
      gameState.currentPlayer = gameState.currentPlayer === 0 ? 1 : 0;
      gameState.status = actionData.nextPhase;
      break;
    case "play_card":
      gameState.actionStream.push({
        roomId: actionData.roomId,
        action: "add_score",
        increaseAmount: actionData.cardInfo,
        playerIndex: actionData.playerIndex,
        nextPhase: "Playing",
        caller: "player",
      });
      parseActionStream(io, gameState);
      sendGameState = false;
      break;
    case "stand_user":
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

  if (sendGameState)
    io.to(actionData.roomId).emit(SocketEvents.S2C.SEND_GAME_STATE, gameState);
}
