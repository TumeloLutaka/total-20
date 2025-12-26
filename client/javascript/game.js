import { SocketEvents } from "../shared/socketEvents.js";

const socket = io();

// ========== BUTTONS TO BE DELETED ========== \\
const btnDrawCard = document.getElementById("btn-draw_card");
const btnEndTurn = document.getElementById("btn-end_turn");
const btnPlayCard = document.getElementById("btn-play_card");
const btnStandUser = document.getElementById("btn-stand_user");

// ========== HTML ELEMENTS TO BE DELETED ========== \\
const drawLastCard = document.getElementById("draw_last_card");
const playerInfo = document.getElementById("player_info");
const playerLastCard1 = document.getElementById("player_last_card_1");
const playerLastCard2 = document.getElementById("player_last_card_2");
const playerScore1 = document.getElementById("player_score_1");
const playerScore2 = document.getElementById("player_score_2");
const playerStood = document.getElementById("player_stood");
const playerTurnInfo = document.getElementById("player_turn_info");
const roundInfo = document.getElementById("round_info");
const status = document.getElementById("game_status");

// ========== CONSTANTS ========== \\
const roomId = window.location.pathname.split("/").pop();

let actionStreamData = {};
let gameState = {};
let playerIndex = "";

socketCall(SocketEvents.C2S.GET_GAME);

// ========== EVENT LISTENERS ========== \\
btnDrawCard.addEventListener("click", () => {
  if (!canPlay()) return;

  createActionStreamData({
    action: "draw_card",
    nextPhase: "Main Phase",
  });
});
btnEndTurn.addEventListener("click", () => {
  if (!canPlay()) return;

  createActionStreamData({
    action: "end_turn",
    nextPhase: "End Phase",
  });
});
btnPlayCard.addEventListener("click", () => {
  if (!canPlay()) return;

  const random = Math.floor(Math.random() * 10) + 1;

  createActionStreamData({
    action: "play_card",
    nextPhase: "Main Phase",
    cardInfo: random,
  });
});
btnStandUser.addEventListener("click", () => {
  if (!canPlay()) return;

  createActionStreamData({
    action: "stand_user",
  });
});

socket.on(SocketEvents.S2C.SEND_GAME_STATE, (_GameState) => {
  gameState = _GameState;

  playerIndex =
    gameState.players[0].id === sessionStorage.getItem("username") ? 0 : 1;

  drawLastCard.textContent = gameState.gameBoard.topCard;
  playerInfo.textContent = gameState.players[playerIndex].tag;
  roundInfo.textContent = gameState.round;
  playerLastCard1.textContent = gameState.players[0].topCard;
  playerLastCard2.textContent = gameState.players[1].topCard;
  playerScore1.textContent = gameState.players[0].score;
  playerScore2.textContent = gameState.players[1].score;
  playerStood.textContent = gameState.players[playerIndex].hasStood
    ? "Stood"
    : "Playing";
  playerTurnInfo.textContent = gameState.currentPlayer + 1;
  status.textContent = gameState.status;

  evaluateGameState()
});

function createActionStreamData(overrides = {}) {
  console.log(playerIndex);

  actionStreamData = {
    roomId,
    playerIndex: playerIndex,
    username: sessionStorage.getItem("username"),
    ...overrides,
  };

  socketCall(SocketEvents.C2S.ACTION_STREAM);
}

function canPlay() {
  // Not this player's turn
  if (gameState.currentPlayer !== playerIndex) return false;

  if (gameState.players[playerIndex].hasStood) 
    
    return false;

  return true;
}

function evaluateGameState() {
  if(gameState.currentPlayer === playerIndex && gameState.players[playerIndex].hasStood)

    // End turn
    createActionStreamData({
    action: "stand_user",
  });
}

function socketCall(command) {
  switch (command) {
    case SocketEvents.C2S.ACTION_STREAM:
      socket.emit(SocketEvents.C2S.ACTION_STREAM, actionStreamData);
      break;
    case SocketEvents.C2S.GET_GAME:
      socket.emit(SocketEvents.C2S.GET_GAME, {
        roomId,
        username: sessionStorage.getItem("username"),
      });
      break;
  }
}
