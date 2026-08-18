import { faker } from "@faker-js/faker";

import Game from "./Game.js";

const MockDB = {
  matches: [
    // {
    //   matchKey: null,
    //   game: {},
    // },
  ],
  users: [
    // { userName: "Testing-001" }
  ],

  /* ============================================================= */
  /* FUNCTIONS */
  /* ============================================================= */
  addUser({ socketId }) {
    const assignedName =
      `${faker.word.adjective()}-${faker.animal.type()}`.toLowerCase();
    const newUser = {
      socketId: socketId,
      userName: assignedName,
    };

    this.users.push(newUser);
    return newUser;
  },

  createMatch(socketId) {
    const newMatch = {
      // Generate a simple, shareable 6-character key
      matchKey: Math.random().toString(36).substring(2, 8).toUpperCase(),
      game: new Game(),
    };

    const userName = this.getUser(socketId).userName;
    newMatch.game.setPlayer(1, socketId, userName);

    this.matches.push(newMatch);

    return newMatch.matchKey;
  },

  deleteMatch(matchKey) {
    const filteredMatches = this.matches.filter(
      (match) => match.matchKey !== matchKey,
    );
    this.matches = filteredMatches;
  },

  deleteUser(userId) {
    const filteredUsers = this.users.filter((user) => user.socketId !== userId);
    this.users = filteredUsers;
  },

  getMatch(matchKey) {
    const match = this.matches.find((match) => match.matchKey === matchKey);
    if (!match) {
      // throw new Error(`Match with key "${matchKey}" does not exist`);
      console.log(`Match with key "${matchKey}" does not exist`);
      return null;
    }

    return match;
  },

  getMatchBySocketId(socketId) {
    return (
      this.matches.find((match) => {
        const { player1, player2 } = match.game;
        return player1?.socketId === socketId || player2?.socketId === socketId;
      }) ?? null
    );
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
    const userName = this.getUser(socketId).userName;
    const game = database.getMatch(matchKey).game;
    game.setPlayer(2, socketId, userName);
  },
};

const database = MockDB;
export default database;
