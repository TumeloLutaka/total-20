import { SocketEvents } from "../shared/socketEvents.js";

const socket = io();

// ========== BUTTONS TO BE DELETED ========== \\
const btnDrawCard = document.getElementById("btn-draw_card");
const btnEndTurn = document.getElementById("btn-end_turn");
const btnStandUser = document.getElementById("btn-stand_user");

// ========== HTML ELEMENTS TO BE DELETED ========== \\
const drawLastCard = document.getElementById("draw_last_card");
const handWrapper = document.getElementById("hand-wrapper");
const playerInfo = document.getElementById("player_info");
const playerLastCard1 = document.getElementById("player_last_card_1");
const playerLastCard2 = document.getElementById("player_last_card_2");
const playerPoints1 = document.getElementById("player_1_points");
const playerPoints2 = document.getElementById("player_2_points");
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
btnStandUser.addEventListener("click", () => {
  if (!canPlay()) return;

  createActionStreamData({
    action: "stand_user",
  });
});

// ========== SOCKET.IO EVENTS LISTENER ========== \\
socket.on(SocketEvents.S2C.SEND_GAME_STATE, (_GameState) => {
  gameState = _GameState;
  const players = gameState.players;

  playerIndex =
    gameState.players[0].id === sessionStorage.getItem("username") ? 0 : 1;

  drawLastCard.textContent = gameState.gameBoard.topCard;
  playerInfo.textContent = players[playerIndex].tag;
  roundInfo.textContent = gameState.round;
  playerLastCard1.textContent = players[0].topCard;
  playerLastCard2.textContent = players[1].topCard;
  playerPoints1.textContent = players[0].points;
  playerPoints2.textContent = players[1].points;
  playerScore1.textContent = players[0].score;
  playerScore2.textContent = players[1].score;
  playerStood.textContent = players[playerIndex].hasStood ? "Stood" : "Playing";
  playerTurnInfo.textContent = gameState.currentPlayer + 1;
  status.textContent = gameState.status;

  renderHand(players[playerIndex].hand);

  evaluateGameState();
});

// ========== FUNCTIONS ========== \\
function createActionStreamData(overrides = {}) {
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

  if (gameState.players[playerIndex].hasStood) return false;

  return true;
}

function evaluateGameState() {
  const player = gameState.players[playerIndex];

  if (gameState.currentPlayer === playerIndex && player.hasStood) {
    createActionStreamData({ action: "stand_user" });
  }
}

function playCard(cardIndex) {
  if (!canPlay()) return;

  createActionStreamData({
    action: "play_card",
    cardIndex,
  });
}

function renderHand(hand) {
  // 1. Clear the existing children
  handWrapper.replaceChildren();

  // 2. Create the fragment (the staging area)
  const fragment = document.createDocumentFragment();

  // 3. Add items to the fragment (no reflows happen here!)
  for (let i = 0; i < hand.length; i++) {
    const cardDiv = document.createElement("cardDiv");
    cardDiv.classList.add("card");
    cardDiv.textContent = `${hand[i].type} | ${hand[i].number}`;
    cardDiv.addEventListener("click", () => playCard(i));
    fragment.appendChild(cardDiv);
  }

  // 4. Append the fragment to the live list (only 1 reflow happens here!)
  handWrapper.appendChild(fragment);
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
