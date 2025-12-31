import { setPlaybackStreamData } from "./playbackHandler.js";

export function handleActionStreamData(gameState) {
  const actionStream = gameState.actionStream;
  const playbackStreamData = [];

  // Update playback stream based on newly received data
  for (let step = 0; step < actionStream.length; step++) {
    const action = actionStream[step].action;

    switch (action) {
      case "start_game":
      case "draw_card":
        playbackStreamData.push(actionStream[step]);
        break;
    }
  }

  setPlaybackStreamData(playbackStreamData, gameState);
}
