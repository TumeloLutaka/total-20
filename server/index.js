import express from "express";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Server } from "socket.io";

import { socketHandler } from "./src/socket.js";
import gameManager from "./src/GameManager.js";

const app = express();
const server = createServer(app);
const io = new Server(server);
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.static(join(__dirname, "../client")));

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "../client/index.html"));
});

app.get("/game/:roomId", (req, res) => {
  res.sendFile(join(__dirname, "../client/game.html"));
});

socketHandler(io, gameManager);

server.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
