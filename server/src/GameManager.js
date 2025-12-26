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
      addPlayer(username) {
        this.players.push({
          id: username,
          tag: "Player " + (this.players.length + 1),
          score: 0,
          topCard: "",
          hasStood: false 
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

const gameManager = new GameManager();
export default gameManager;
