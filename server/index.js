// ======================================================== \\
// THIRD PARTY IMPORTS
// ======================================================== \\
import "dotenv/config";

import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

// ======================================================== \\
// CUSTOM IMPORTS
// ======================================================== \\
import database from "./src/services/database.js";
import { gameHandler } from "./src/delivery/socket/gameHandler.js";
import { matchHandler } from "./src/delivery/socket/matchHandler.js";

// ============================================================ \\
// server/index.js
// Entry point: Express server, Socket.io lifecycle, match routing.
// ============================================================ \\
const app = express();
app.use(cors());
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL;

const io = new Server(server, {
  cors: {
    origin: [CLIENT_URL],
    method: ["GET", "POST"],
  },
});

io.on("connection", async (socket) => {
  console.log("connection: " + socket.id);
  const user = await database.addUser({ socketId: socket.id });
  await cleanupStaleState();
  socket.emit("user-data", { user });

  const users = await database.getUsersWithStatus();
  io.emit("update_users", { users });

  socket.on("disconnect", async () => {
    console.log("Disconnecting: ", socket.id);
    await database.deleteUser(socket.id);
    await cleanupStaleState();

    const users = await database.getUsersWithStatus();
    const rooms = await database.getMatches();
    io.emit("update_users", { rooms, users });
  });

  socket.on("get-users", async () => {
    const users = await database.getUsersWithStatus();
    const rooms = await database.getMatches();
    socket.emit("update_users", { rooms, users });
  });

  socket.on("get-user-data", async () => {
    const currentUser = await database.getUser(socket.id);
    if (currentUser) {
      socket.emit("user-data", { user: currentUser });
    }
  });

  matchHandler(socket, io, database, cleanupMatch);
  gameHandler(socket, io, database, cleanupMatch);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  console.log("Server is running on port: " + PORT);
  await cleanupStaleState();
});

// ======================================================== \\
// BOOTSTRAP HELPERS
// ======================================================== \\

async function cleanupStaleState() {
  const activeSocketIds = new Set(io.sockets.sockets.keys());
  await database.cleanupStaleUsers(activeSocketIds);
  await database.cleanupStaleMatches(activeSocketIds);
}

async function cleanupMatch(matchKey) {
  const room = io.sockets.adapter.rooms.get(matchKey);

  if (room) {
    for (const socketId of room) {
      const s = io.sockets.sockets.get(socketId);
      if (s) s.leave(matchKey);
    }
  }

  await database.deleteMatch(matchKey);

  const users = await database.getUsersWithStatus();
  const rooms = await database.getMatches();

  io.emit("update_users", { rooms, users });
}
