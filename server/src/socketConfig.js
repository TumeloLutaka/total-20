import { SocketEvents } from "../../client/shared/socketEvents.js";
import { ActionPhases } from "../../client/shared/actionPhases.js";

// Define your valid "exception" transitions here
const VALID_TRANSITIONS = {
  [ActionPhases.PLAY_PHASE]: [
    ActionPhases.END_PHASE,
    ActionPhases.STAND_USER, // Now "Standing" is also allowed
  ],
  [ActionPhases.UPKEEP_PHASE]: [
    ActionPhases.END_PHASE, // client auto-response
  ],
  [ActionPhases.TOTAL20_HIT]: [ActionPhases.STAND_USER, ActionPhases.END_PHASE],
};

let io = null;

export const socketHandler = (_io, gameManager) => {
  io = _io;

  io.on("connection", (socket) => {
    console.log("A user connected", socket.id);
    io.to(socket.id).emit(
      SocketEvents.S2C.PRIVATE_MESSAGE,
      "Hello User!" + socket.request.user.id
    );
    io.to(socket.id).emit(SocketEvents.S2C.GIVE_ID, socket.request.user.id);

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
    gameState.addPlayer(
      socket.request.user.name,
      socket.request.user.id,
      socket.id
    );

    // Find game related to room
    if (gameState.players.length === 2) {
      gameState.actionStream.push({
        action: ActionPhases.START_GAME,
      });

      gameState.status = ActionPhases.DRAW_PHASE;
      // Send player data so they can start game.
      sendGameStateToPlayers(io, gameState);
    }
  });

  socket.on(SocketEvents.C2S.ACTION_STREAM, (actionData) => {
    const gameState = gameManager.getGame(actionData.roomId);
    if (!gameState) return;

    // Validate action
    // console.log("Is Valid: ", validateIntent(gameState, actionData, socket));
    if (!validateIntent(gameState, actionData, socket)) return;
    // console.log("Passed Validation Check");

    // Process action and mutate State
    processAction(gameState, actionData);

    sendGameStateToPlayers(io, gameState);
  });
}

// ===================== FUNCTIONS ===================== \\
function CheckIfPlayerHit20(player) {
  // Auto stand player if they hit 20
  if (player.score === 20) {
    return true;
  }

  return false;
}

function createPlayLoad(gameState, overrides) {
  return {
    callerIndex: gameState.currentPlayerIndex,
    ...overrides,
  };
}

function evaluateRound(gameState) {
  // Don't evaluate if game is already over

  // Get the current player
  const [player1, player2] = gameState.players;

  const resolveSet = (winner) => {
    if (winner) {
      winner.points += 1;

      if (winner.points === 2) {
        gameState.status = ActionPhases.GAME_OVER;
        const winnerText = `Player ${gameState.players.indexOf(winner) + 1}!`;
        gameState.winner = { text: winnerText };
        return; // Stop here, don't reset for a new set
      }
    }

    // Reset for next set
    player1.score = 0;
    player2.score = 0;
    player1.hasStood = false;
    player2.hasStood = false;
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

function processAction(gameState, actionData) {
  // Set game state to processing so no other action can be taken.
  gameState.isProcessing = true;

  // Get current player
  const player = gameState.players[gameState.currentPlayerIndex];

  switch (actionData.action) {
    case ActionPhases.DRAW_PHASE:
      if (player.hasDrawn) break;

      // Lock player so they can't draw again.
      player.hasDrawn = true;

      // Draw random card from 1 - 10
      const drawCardNumber = Math.floor(Math.random() * 10) + 1;
      // Determine which player drew and add draw pile varible to actionData
      const drawerPile = gameState.currentPlayerIndex + 1;
      const drawnCard = { number: drawCardNumber, type: "purple" };

      // Change player score based on the drawn card.
      UpdatePlayerScore(gameState, player, drawnCard);

      const drawActionPayload = createPlayLoad(gameState, {
        action: ActionPhases.DRAW_PHASE,
        drawerPile,
        drawnCard,
      });
      gameState.actionStream.push(drawActionPayload);

      // Check if the player
      if (CheckIfPlayerHit20(player)) {
        player.hasStood = true;
        const standActionPayload = createPlayLoad(gameState, {
          action: ActionPhases.STAND_USER,
        });
        gameState.actionStream.push(standActionPayload);
      }

      gameState.status = actionData.nextPhase;
      break;

    case ActionPhases.END_PHASE:
      // Reset flags for the player who just finished
      player.hasDrawn = false;
      player.hasPlayed = false;

      // Checking for win conditions.
      evaluateRound(gameState);
      const nextPhase =
        gameState.status === ActionPhases.GAME_OVER
          ? ActionPhases.GAME_OVER
          : ActionPhases.UPKEEP_PHASE;

      // Switch active player
      gameState.currentPlayerIndex = gameState.currentPlayerIndex === 0 ? 1 : 0;

      // Create action for ending turn
      const endActionPayload = createPlayLoad(gameState, {
        action: ActionPhases.END_PHASE,
        nextPhase,
        nextPlayerIndex: gameState.currentPlayerIndex + 1,
      });
      gameState.actionStream.push(endActionPayload);

      gameState.status = nextPhase;
      break;

    case ActionPhases.PLAY_PHASE:
      // Check if player meets conditions to play a card.
      if (!player.hasDrawn || player.hasPlayed) break;

      player.hasPlayed = true; // Lock play for this turn

      // Get selected card based on provided index from the player
      const selectedCard = player.hand[actionData.cardIndex];
      // Change player score based on the played card.
      UpdatePlayerScore(gameState, player, selectedCard);

      // Remove selected card from the hand based on Index.
      player.hand = player.hand.filter((card, index) => {
        return index !== actionData.cardIndex;
      });

      // Create action to animate the movement of the drawn card.
      const playerPile = gameState.currentPlayerIndex + 1;
      const playActionPayload = createPlayLoad(gameState, {
        action: ActionPhases.PLAY_PHASE,
        playerPile,
        drawnCard: selectedCard,
        cardIndex: actionData.cardIndex,
      });
      gameState.actionStream.push(playActionPayload);

      // Check if the player
      if (CheckIfPlayerHit20(player)) {
        // Auto stand player
        const totalTwentyActionPayload = createPlayLoad(gameState, {
          action: ActionPhases.TOTAL20_HIT,
        });
        gameState.actionStream.push(totalTwentyActionPayload);
        gameState.status = ActionPhases.TOTAL20_HIT;
        break;
      }

      gameState.status = actionData.nextPhase;
      break;

    case ActionPhases.STAND_USER:
      // Tiggers: Stand Button. When player hits 20.
      player.hasStood = true;

      const standActionPayload = createPlayLoad(gameState, {
        action: ActionPhases.STAND_USER,
      });
      gameState.actionStream.push(standActionPayload);
      break;

    case ActionPhases.UPKEEP_PHASE: {
      // If the current player is already standing, auto-end their turn
      if (player.hasStood) {
        const upkeepPayload = createPlayLoad(gameState, {
          action: ActionPhases.UPKEEP_PHASE,
          nextPhase: ActionPhases.END_PHASE,
        });
        gameState.actionStream.push(upkeepPayload);

        gameState.status = ActionPhases.END_PHASE;
        break;
      }

      const upkeepPayload = createPlayLoad(gameState, {
        action: ActionPhases.UPKEEP_PHASE,
        nextPhase: ActionPhases.DRAW_PHASE,
      });
      gameState.actionStream.push(upkeepPayload);

      gameState.status = ActionPhases.DRAW_PHASE;
      break;
    }
  }

  gameState.isProcessing = false;
}

function sendGameStateToPlayers(io, gameState) {
  // TODO: UPDATE Function to send edited curated gamestate
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

function UpdatePlayerScore(gameState, player, card) {
  let multipler = card.type === "red" ? -1 : 1;
  player.score += card.number * multipler;
}

function validateIntent(gameState, actionData, socket) {
  // SECURE: Get ID directly from the authenticated session
  const authenticatedUserId = socket.request.user.id;
  const player = gameState.players.find(
    (player) => player.id === authenticatedUserId
  );

  if (!player) return false;

  // Check if it's the player's turn
  const playerIndex = gameState.players.indexOf(player);
  if (playerIndex !== gameState.currentPlayerIndex) return false;

  // Check if the gameState is already processing an action
  if (gameState.isProcessing) return false;

  // Check if the game is already over.
  if (gameState.status === ActionPhases.GAME_OVER) return false;

  // Check if action matches phase
  if (!isStatusCheckValid(gameState, actionData)) return false;

  return true;

  function isStatusCheckValid(gameState, actionData) {
    const { status } = gameState;
    const { action } = actionData;

    if (status === action) return true;

    const allowed = VALID_TRANSITIONS[status] || [];
    const isValid = allowed.includes(action);

    if (!isValid) {
      console.warn(
        `[REJECTED] Player tried '${action}' while game is in '${status}'`
      );
    }

    return isValid;
  }
}
