import { Socket } from "socket.io";
import { ActionPhases } from "../../client/shared/actionPhases.js";

// gameManager.js
class GameManager {
  constructor() {
    this.games = new Map();
  }

  createGame(roomName) {
    this.games.set(roomName, {
      actionStream: [],
      currentPlayerIndex: 0,
      isProcessing: false,
      players: [],
      round: 1,
      status: ActionPhases.WAITING_PHASE,
      addPlayer(username, userId, socketId) {
        this.players.push({
          id: userId,
          hand: GenerateHand(),
          hasDrawn: false,
          hasPlayed: false,
          hasStood: false,
          points: 0,
          position: this.players.length,
          score: 0,
          socketId,
          username,
        });
      },
    });
    console.log("Created new game:" + roomName);
  }

  getGame(roomId) {
    return this.games.get(roomId);
  }

  updateGame(roomName, updates) {
    const game = this.games.get(roomName);
    if (game) {
      Object.assign(game, updates);
    }
    return game;
  }

  deleteGame(roomName) {
    this.games.delete(roomName);
  }

  getAllGames() {
    return Array.from(this.games.values());
  }
}

function GenerateHand() {
  const cards = [];

  for (let i = 0; i < 5; i++) {
    const randomNum = Math.floor(Math.random() * 10) + 1;
    const randomCol = Math.floor(Math.random() * 2) + 1 === 1 ? "blue" : "red";
    cards.push({
      number: randomNum,
      type: randomCol,
    });
  }

  return cards;
}

const gameManager = new GameManager();
export default gameManager;
