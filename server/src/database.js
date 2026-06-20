import Game from "./Game.js";

const MockDB = {
  matches: [
    {
      matchKey: null,
      game: {},
    },
  ],
  users: [],
  addUser({ socketId }) {
    const formatted = String(this.users.length + 1).padStart(3, "0");

    const newUser = {
      socketId: socketId,
      name: "Guest-" + formatted,
    };

    this.users.push(newUser);
  },

  createMatch(socketId) {
    const newMatch = {
      // Generate a simple, shareable 6-character key
      matchKey: Math.random().toString(36).substring(2, 8).toUpperCase(),
      game: new Game(),
    };

    const userName = this.getUser(socketId).name;
    newMatch.game.setPlayer(1, socketId, userName);

    this.matches.push(newMatch);

    return newMatch.matchKey;
  },

  deleteUser(userId) {
    const filteredUsers = this.users.filter((user) => user.id !== userId);
    this.users = filteredUsers;
  },

  getMatch(matchKey) {
    const match = this.matches.find((match) => match.matchKey === matchKey);
    if (!match) {
      throw new Error(`Match with key "${matchKey}" does not exist`);
    }

    return match;
  },

  getMatches() {
    return this.matches;
  },

  getUser(socketId) {
    try {
      const foundUser = this.users.find((user) => user.socketId === socketId);

      if (!foundUser) {
        throw new Error(`User with the socket id: ${socketId} not found!`);
      }

      return foundUser;
    } catch (error) {
      console.log(error.message);
    }

    return null;
  },

  getUsers() {
    return this.users;
  },

  joinMatch(matchKey, socketId) {
    // Set joined player as player 2
    const userName = this.getUser(socketId).name;
    const game = database.getMatch(matchKey).game;
    game.setPlayer(2, socketId, userName);
  },
};

const database = MockDB;
export default database;
