// Get intent handler function
import * as IntentHandler from "./intentHandler.js";
import { markPlaybackStepComplete } from "./playbackHandler.js";
import * as Animations from "./animation.js";

// ========== BUTTONS TO BE DELETED ========== \\
const btnDrawCard = document.getElementById("btn-draw_card");
const btnEndTurn = document.getElementById("btn-end_turn");
const btnStandUser = document.getElementById("btn-stand_user");

// ========== HTML ELEMENTS TO BE DELETED ========== \\
const playerPoints1 = document.getElementById("player_points_1");
const playerPoints2 = document.getElementById("player_points_2");
const scoreHolder1 = document.querySelector("#score_holder_1");
const scoreHolder2 = document.querySelector("#score_holder_2");
const p1Stood = document.querySelector("#p1_stood");
const p2Stood = document.querySelector("#p2_stood");
const playerTurnInfo = document.getElementById("player_turn_info");
const roundInfo = document.getElementById("round_info");
const status = document.getElementById("game_status");

// ========== HTML ELEMENTS CARDS TO BE IMPROVED ========== \\
const drawDeckCard = document.getElementById("draw_deck-card");
const playerHand = document.querySelector(".player-hand");
const opponentHand = document.querySelector(".opponent-hand");

// ========== CONSTANTS ========== \\
let player = null;
let opponent = null;

export function initializeUI(gameState) {
  const players = gameState.players;

  player =
    gameState.players[0].hand === null
      ? gameState.players[1]
      : gameState.players[0];
  opponent =
    player === gameState.players[0]
      ? gameState.players[1]
      : gameState.players[0];

  const playerIndex = gameState.players[0].hand === null ? 1 : 0;

  roundInfo.textContent = playerIndex;
  // roundInfo.textContent = gameState.round;
  playerPoints1.textContent = players[0].points;
  playerPoints2.textContent = players[1].points;
  scoreHolder1.textContent = players[0].score;
  scoreHolder2.textContent = players[1].score;
  p1Stood.textContent = players[0].hasStood ? "Standing" : "Active";
  p2Stood.textContent = players[1].hasStood ? "Standing" : "Active";
  playerTurnInfo.textContent = gameState.currentPlayer + 1;
  status.textContent = gameState.status;

  renderHand(player.hand);
  renderOpponentHand();

  markPlaybackStepComplete();
}

// ========== EVENT LISTENERS ========== \\
btnDrawCard.addEventListener("click", () => IntentHandler.drawCard());
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

// ==================== PRIVATE  FUNCTIONS ==================== \\
function createCard(value, type, owner = "") {
  const cardContainer = document.createElement("div");
  cardContainer.className = "card-outer";

  cardContainer.innerHTML = `
    <div class="card-inner card-${owner}">
      <div class="card-front card-${type}">${value}</div>
      <div class="card-back"></div>
    </div>
  `;

  return cardContainer;
}

function renderHand(hand) {
  if (hand === null) return;

  // 1. Clear the existing children
  playerHand.replaceChildren();

  // 2. Create the fragment (the staging area)
  const fragment = document.createDocumentFragment();

  // 3. Add items to the fragment (no reflows happen here!)
  for (let i = 0; i < hand.length; i++) {
    const card = createCard(hand[i].number, hand[i].type, "player");
    card.addEventListener("click", () => IntentHandler.playCard(i));
    fragment.appendChild(card);
  }

  // 4. Append the fragment to the live list (only 1 reflow happens here!)
  playerHand.appendChild(fragment);
}

function renderOpponentHand() {
  if (opponent === null) return;

  // 1. Clear the existing children
  opponentHand.replaceChildren();

  // 2. Create the fragment (the staging area)
  const fragment = document.createDocumentFragment();

  // 3. Add items to the fragment (no reflows happen here!)
  for (let i = 0; i < opponent.handCount; i++) {
    const card = createCard(0, "purple");
    fragment.appendChild(card);
  }

  // 4. Append the fragment to the live list (only 1 reflow happens here!)
  opponentHand.appendChild(fragment);
}

function updateScore(value) {
  scoreHolder1.textContent = players[0].score;
}

// ==================== PUBLIC FUNCTIONS ==================== \\
export async function draw_card() {
  // Get the first card in the player's hand
  const card = playerHand.children[0]; // or select by class: playerHand.querySelector(".card-outer")

  // Await the animation to finish
  await Animations.moveCard(card, pile1);

  // Continue with post-animation logic
  updatePoints();
}
