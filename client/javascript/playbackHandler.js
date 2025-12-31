import { initializeUI } from "./uiHandler.js";

let playbackStep = 0;
let playbackStream = [];

export function setPlaybackSteamData (_PlaybackStream) {
   playbackStream = _PlaybackStream 
}


function evaluateGameState() {
  if (gameState.currentPlayer === player.position && player.hasStood) {
    createActionStreamData({ action: "stand_user" });
  }
}
