import * as UIHandler from "./uiHandler.js";
import { ActionPhases } from "../shared/actionPhases.js";

let playbackActive = false;
let playbackStep = 0;
let playbackStream = [];

function runPlayBack() {
  if (playbackActive) return;
  if (playbackStep >= playbackStream.length) return;

  playbackActive = true;
  const playbackAction = playbackStream[playbackStep];

  switch (playbackAction.action) {
    case ActionPhases.DRAW_PHASE:
      UIHandler.drawCard(playbackAction);
      break;
    case ActionPhases.END_PHASE:
      UIHandler.endTurn(playbackAction);
      break;
    case ActionPhases.PLAY_PHASE:
      UIHandler.playCard(playbackAction);
      break;
    case ActionPhases.STAND_USER:
      UIHandler.standUser(playbackAction);
      break;
    case ActionPhases.START_GAME:
      UIHandler.initializeUI(playbackAction);
      break;
    case ActionPhases.TOTAL20_HIT:
      UIHandler.totalTwentyHit(playbackAction)
      break;
    case ActionPhases.UPKEEP_PHASE:
      UIHandler.handleUpkeep(playbackAction);
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

export function setPlaybackStreamData(_PlaybackStream) {
  playbackStream = _PlaybackStream;
  playbackStep = 0;

  console.log(playbackStream);
  runPlayBack();
}
