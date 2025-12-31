import { initializeUI } from "./uiHandler.js";

let gameState = null;

let playbackActive = false;
let playbackStep = 0;
let playbackStream = [];

function runPlayBack() {
  if (playbackActive) return;
  if (playbackStep >= playbackStream.length) return;

  if (gameState == null) return;

  playbackActive = true;
  const playbackAction = playbackStream[playbackStep];

  switch (playbackAction.action) {
    case "start_game":
      initializeUI(gameState);
      break;
    case "draw_card":
      initializeUI(gameState);
      break;
    // other actions can be handled here
  }
}

export function markPlaybackStepComplete() {
  playbackActive = false;
  playbackStep++;

  if (playbackStep < playbackStream.length) {
    runPlayBack();
  }
}

export function setPlaybackStreamData(_PlaybackStream, _GameState) {
  playbackStream = _PlaybackStream;
  gameState = _GameState;

  console.log(playbackStream);
  runPlayBack();
}

function evaluateGameState() {
  if (gameState.currentPlayer === player.position && player.hasStood) {
    createActionStreamData({ action: "stand_user" });
  }
}
