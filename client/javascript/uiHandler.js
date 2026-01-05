// Get intent handler function
import * as IntentHandler from "./intentHandler.js";
import { markPlaybackStepComplete } from "./playbackHandler.js";
import * as Animations from "./animation.js";
import { ActionPhases } from "../shared/actionPhases.js";

// ========== BUTTONS========== \\
const btnDrawCard = document.getElementById("btn-draw_card");
const btnEndTurn = document.getElementById("btn-end_turn");
const btnHome = document.getElementById("btn-home");
const btnStandUser = document.getElementById("btn-stand_user");

// ========== HTML ELEMENTS ========== \\
const playerPoints1 = document.getElementById("player_points_1");
const playerPoints2 = document.getElementById("player_points_2");
const scoreHolder1 = document.querySelector("#score_holder_1");
const scoreHolder2 = document.querySelector("#score_holder_2");
const p1Stood = document.querySelector("#p1_stood");
const p2Stood = document.querySelector("#p2_stood");
const playerTurnInfo = document.querySelector("#player_turn_info");
const roundInfo = document.getElementById("round_info");
const status = document.getElementById("game_status");

const playerIndicator = document.querySelector(".player-indicator")

// ========== HTML CARD ELEMENTS ========== \\
const drawDeck = document.querySelector(".draw-deck");
const playerHand = document.querySelector(".player-hand");
const opponentHand = document.querySelector(".opponent-hand");


// ========== EVENT LISTENERS ========== \\
btnDrawCard.addEventListener("click", () => IntentHandler.drawCard());
btnEndTurn.addEventListener("click", () => IntentHandler.endTurn());
btnHome.addEventListener("click", () => (window.location.href = "/"));
btnStandUser.addEventListener("click", () => IntentHandler.standUser());

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

function handleGameOver(actionData) {
  // showGameOver screen
  const gameOverOverlay = document.querySelector(".game-over-overlay");
  const winnerAnnouncement = document.querySelector("#winner-announcement");
  const finalScores = document.querySelector("#final-scores");

  winnerAnnouncement.textContent = `${actionData.winner.text} Wins`;
  finalScores.textContent = `${actionData.player1Values.points} - ${actionData.player2Values.points}`;

  document.querySelector("#final-scores-1").textContent =
    actionData.player1Values.username;
  document.querySelector("#final-scores-2").textContent =
    actionData.player2Values.username;

  setTimeout(() => {
    gameOverOverlay.classList.remove("hidden");
  }, 500);
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
    card.addEventListener("click", (event) => {
      // Get parent container
      const parent = event.currentTarget.parentNode;
      const currentIndex = Array.from(parent.children).indexOf(
        event.currentTarget
      );

      IntentHandler.playCard(currentIndex);
    });
    fragment.appendChild(card);
  }

  // 4. Append the fragment to the live list (only 1 reflow happens here!)
  playerHand.appendChild(fragment);
}

function renderOpponentHand(count) {
  // 1. Clear the existing children
  opponentHand.replaceChildren();

  // 2. Create the fragment (the staging area)
  const fragment = document.createDocumentFragment();

  // 3. Add items to the fragment (no reflows happen here!)
  for (let i = 0; i < count; i++) {
    const card = createCard(0, "purple");
    fragment.appendChild(card);
  }

  // 4. Append the fragment to the live list (only 1 reflow happens here!)
  opponentHand.appendChild(fragment);
}

function updateScore(v1, v2) {
  scoreHolder1.textContent = v1.score;
  scoreHolder2.textContent = v2.score;

  playerPoints1.textContent = v1.points;
  playerPoints2.textContent = v2.points;
}

function updateUI(actionData) {
  // Update the UI to indicate the current player standing
  p1Stood.textContent = actionData.player1Standing ? "STANDING" : "ACTIVE";
  p2Stood.textContent = actionData.player2Standing ? "STANDING" : "ACTIVE";

  status.textContent = actionData.gameStatus;
  roundInfo.textContent = actionData.currentRound;
  playerTurnInfo.textContent = actionData.currentPlayerIndex + 1;
}

// ==================== PUBLIC FUNCTIONS ==================== \\
export async function drawCard(actionData) {
  // ANIMATE THE DRAWING OF A CARD AND PLACING IT IN OPPONENT OR PLAYER PILE
  // Get the first card in the player's hand
  const card = drawDeck.children[0];
  const cardFront = card.querySelector(".card-front"); // get the inner element
  cardFront.innerHTML = actionData.drawnCard.number;
  cardFront.className = "card-front card-purple"; // set a new class (replaces existing)

  // Create card to replace the drawn one
  const newCard = createCard(0, "purple");
  drawDeck.appendChild(newCard);

  // Await the animation to finish
  const drawPile = document.querySelector(".p" + actionData.drawerPile);
  await Animations.moveAndFlipCard(card, drawPile);

  // Continue with post-animation logic
  updateScore(actionData.player1Values, actionData.player2Values);
  updateUI(actionData);
  markPlaybackStepComplete();
}

export async function endTurn(actionData) {
  updateScore(actionData.player1Values, actionData.player2Values);
  updateUI(actionData);

  // Show end of turn indicator customize based on which caller it is.
  const isCaller =
    actionData.callerIndex === actionData.playerIndex ? true : false;

  await Animations.showEndTurnIndicator(playerIndicator, isCaller)

  setTimeout(() => {
    // TODO: Have animation for showing the changing of phases and turns
    markPlaybackStepComplete();

    // Caller ends their turn
    if (actionData.nextPhase === ActionPhases.UPKEEP_PHASE)
      IntentHandler.handleUpkeep();
    else if (actionData.nextPhase === ActionPhases.GAME_OVER)
      handleGameOver(actionData);
  }, 1000);
}

export async function handleUpkeep(actionData) {
  updateScore(actionData.player1Values, actionData.player2Values);
  updateUI(actionData);


  const isCaller = actionData.callerIndex === actionData.playerIndex;

  await Animations.showPlayerTurnIndicator(playerIndicator, isCaller)

  markPlaybackStepComplete();

  if (isCaller && actionData.nextPhase === ActionPhases.STAND_USER) {
    IntentHandler.standUser();
  }
}

export function initializeUI(actionData) {
  // Get player values
  const playerValues =
    actionData.playerIndex === 0
      ? actionData.player1Values
      : actionData.player2Values;

  document.querySelector("#p1_name").textContent =
    actionData.player1Values.username;
  document.querySelector("#p2_name").textContent =
    actionData.player2Values.username;

  // Highlight which player the client is by changing the light of the player card text
  const playerTexts = document.querySelectorAll(".hud-label");
  const targetText = playerTexts[actionData.playerIndex];
  targetText.classList.add("hud-label-player");

  // roundInfo.textContent = playerIndex;
  updateScore(actionData.player1Values, actionData.player2Values);
  updateUI(actionData);

  renderHand(playerValues.hand);
  renderOpponentHand(actionData.opponentHandCount);

  markPlaybackStepComplete();
}

export async function playCard(actionData) {
  // GET CARD FROM PLAYER/OPPONENT HAND AND ANIMATE IT
  const isCaller =
    actionData.callerIndex === actionData.playerIndex ? true : false;

  const selectedHand = isCaller ? playerHand : opponentHand;
  const selectedCard = selectedHand.children[actionData.cardIndex];

  // Await the animation to finish
  const playPile = document.querySelector(`.p${actionData.callerIndex + 1}`);

  if (isCaller) {
    await Animations.moveCard(selectedCard, playPile);
  } else {
    const cardFront = selectedCard.querySelector(".card-front"); // get the inner element
    cardFront.innerHTML = actionData.drawnCard.number;
    cardFront.className = `card-front card-${actionData.drawnCard.type}`; // set a new class (replaces existing)

    await Animations.moveAndFlipOpponentCard(selectedCard, playPile);
  }
  // Continue with post-animation logic
  updateScore(actionData.player1Values, actionData.player2Values);
  updateUI(actionData);
  markPlaybackStepComplete();
}

export async function standUser(actionData) {
  // Update the UI to indicate the current player standing
  updateUI(actionData);

  // Only call end turn if client is the one who called stand.
  const isCaller =
    actionData.callerIndex === actionData.playerIndex ? true : false;

  await Animations.showStandingUserIndicator(playerIndicator, isCaller)

  setTimeout(() => {
    // TODO: Have animation for showing the changing of phases and turns
    markPlaybackStepComplete();

    // Caller ends their turn
    if (isCaller) IntentHandler.endTurn();
  }, 1000);
}

export function totalTwentyHit(actionData) {
  // TODO: Play Total twenty hit animation
  updateUI(actionData);

  // Only call end turn if client is the one who played.
  const isCaller =
    actionData.callerIndex === actionData.playerIndex ? true : false;

  setTimeout(() => {
    // TODO: Have animation for showing the changing of phases and turns
    markPlaybackStepComplete();

    // Caller ends their turn
    if (isCaller) IntentHandler.standUser();
  }, 500);
}
