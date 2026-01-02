import { setPlaybackStreamData } from "./playbackHandler.js";

let actionStep = 0;

export function handleActionStreamData(gameState) {
  const actionStream = gameState.actionStream;
  const playbackStreamData = [];

  console.log(actionStream);

  // Update playback stream based on newly received data
  let step;
  for (step = actionStep; step < actionStream.length; step++) {
    playbackStreamData.push({
      ...actionStream[step],
      player1Values: {
        hand: gameState.players[0].hand,
        username: gameState.players[0].username,
        points: gameState.players[0].points,
        score: gameState.players[0].score,
      },
      player2Values: {
        hand: gameState.players[1].hand,
        username: gameState.players[1].username,
        points: gameState.players[1].points,
        score: gameState.players[1].score,
      },
      player1Standing: gameState.players[0].hasStood,
      player2Standing: gameState.players[1].hasStood,
      gameStatus: gameState.status,
      currentRound: gameState.round,
      currentPlayerIndex: gameState.currentPlayerIndex,
      playerIndex: gameState.players[0].hand === null ? 1 : 0,
      opponentHandCount:
        gameState.players[0].hand === null
          ? gameState.players[0].handCount
          : gameState.players[1].handCount,
      winner: gameState.winner,
    });
  }

  actionStep = step;
  setPlaybackStreamData(playbackStreamData, gameState);
}
