import { Redis } from "@upstash/redis";
import { faker } from "@faker-js/faker";

import Game from "./Game.js";

const redis = Redis.fromEnv();

// Helper to restore class prototype methods on plain JSON game objects
function rehydrateMatch(rawMatch) {
  if (!rawMatch) return null;

  const data = typeof rawMatch === "string" ? JSON.parse(rawMatch) : rawMatch;

  return {
    matchKey: data.matchKey,
    game: Game.fromData(data.game),
  };
}

const redisDatabase = {
  async addUser({ socketId }) {
    const assignedName =
      `${faker.word.adjective()}-${faker.animal.type()}`.toLowerCase();
    const newUser = { socketId, userName: assignedName };
    await redis.hset("users", { [socketId]: JSON.stringify(newUser) });
    return newUser;
  },

  async cleanupStaleMatches(activeSocketIds) {
    const matches = await this.getMatches();

    for (const match of matches) {
      const player1 = match.game.player1;
      const player2 = match.game.player2;

      const player1Online = player1 && activeSocketIds.has(player1.socketId);

      const player2Online = player2 && activeSocketIds.has(player2.socketId);

      if (!player1Online || !player2Online) {
        console.log(`Removing stale match: ${match.matchKey}`);
        await this.deleteMatch(match.matchKey);
      }
    }
  },

  async cleanupStaleUsers(activeSocketIds) {
    const users = await this.getUsers();

    for (const user of users) {
      if (!activeSocketIds.has(user.socketId)) {
        console.log(`Removing stale user: ${user.userName} (${user.socketId})`);

        await this.deleteUser(user.socketId);
      }
    }
  },

  async createMatch(socketId) {
    const matchKey = Math.random().toString(36).substring(2, 8).toUpperCase();
    const user = await this.getUser(socketId);

    const game = new Game();
    if (user) {
      game.setPlayer(1, socketId, user.userName);
    }

    const matchData = { matchKey, game };
    await redis.hset("matches", { [matchKey]: JSON.stringify(matchData) });
    return matchKey;
  },

  async deleteMatch(matchKey) {
    await redis.hdel("matches", matchKey);
  },

  async deleteUser(socketId) {
    await redis.hdel("users", socketId);
  },

  async getMatch(matchKey) {
    const rawMatch = await redis.hget("matches", matchKey);
    if (!rawMatch) {
      console.log(`Match with key "${matchKey}" does not exist`);
      return null;
    }
    return rehydrateMatch(rawMatch);
  },

  async getMatchBySocketId(socketId) {
    const matches = await this.getMatches();
    return (
      matches.find((match) => {
        const { player1, player2 } = match.game;
        return player1?.socketId === socketId || player2?.socketId === socketId;
      }) ?? null
    );
  },

  async getMatches() {
    const rawMatches = await redis.hgetall("matches");
    if (!rawMatches) return [];

    return Object.values(rawMatches).map((rawMatch) =>
      rehydrateMatch(rawMatch),
    );
  },

  async getUser(socketId) {
    try {
      const user = await redis.hget("users", socketId);
      if (!user) {
        throw new Error(`User with the socket id: ${socketId} not found!`);
      }
      return typeof user === "string" ? JSON.parse(user) : user;
    } catch (error) {
      console.log(error.message);
      return null;
    }
  },

  async getUsers() {
    const rawUsers = await redis.hgetall("users");
    if (!rawUsers) return [];

    return Object.values(rawUsers).map((user) =>
      typeof user === "string" ? JSON.parse(user) : user,
    );
  },

  async joinMatch(matchKey, socketId) {
    const user = await this.getUser(socketId);
    const match = await this.getMatch(matchKey);

    if (match && user) {
      match.game.setPlayer(2, socketId, user.userName);
      await this.saveMatch(matchKey, match);
    }
  },

  async saveMatch(matchKey, match) {
    await redis.hset("matches", { [matchKey]: JSON.stringify(match) });
  },
};

const database = redisDatabase;
export default database;
