import { Socket } from "socket.io";

// gameManager.js
class GameManager {
  constructor() {
    this.games = new Map();
  }

  createGame(roomName) {
    this.games.set(roomName, {
      players: [],
      currentPlayer: 0,
      round: 1,
      status: "waiting",
      actionStream: [],
      addPlayer(username, socketId) {
        this.players.push({
          id: username,
          socketId,
          hand: GenerateHand(),
          hasDrawn: false,
          hasPlayed: false,
          hasStood: false ,
          points: 0,
          score: 0,
          tag: "Player " + (this.players.length + 1),
          topCard: "",
          position: this.players.length
        });
      },
      gameBoard: {
        topCard: ""
      }
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

function GenerateHand(){
  const cards = []

  for(let i = 0; i < 5; i++) {
    const randomNum = Math.floor(Math.random() * 10 ) + 1
    const randomCol = Math.floor(Math.random() * 2 ) + 1 === 1 ? "blue" : "red"
    cards.push({
      number: randomNum,
      type: randomCol
    })
  }

  return cards;
}

const gameManager = new GameManager();
export default gameManager;
