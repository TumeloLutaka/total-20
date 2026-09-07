// ============================================================ \\
// delivery/socket/matchHandler.js
// Boundary: handles all match lifecycle socket events.
// ============================================================ \\

/**
 * @param {import("socket.io").Socket} socket
 * @param {import("socket.io").Server} io
 * @param {object} database
 * @param {Function} cleanupMatch - async fn(matchKey)
 */
export function matchHandler(socket, io, database, cleanupMatch) {
  socket.on("create_match", async () => {
    const matchKey = await database.createMatch(socket.id);
    socket.join(matchKey);
    socket.emit("match-created", matchKey);

    io.emit("update_users", {
      rooms: await database.getMatches(),
      users: await database.getUsersWithStatus(),
    });
  });

  socket.on("leave-match", async ({ matchKey }) => {
    console.log("LEAVING MATCH");

    const match = await database.getMatch(matchKey);
    if (!match) return;

    socket.to(matchKey).emit("game-event", {
      type: "OPPONENT_LEFT",
      payload: { matchKey },
    });

    socket.leave(matchKey);
    setTimeout(async () => await cleanupMatch(matchKey), 3000);
  });

  socket.on("join-match", async (matchKey) => {
    const cleanKey = matchKey.trim().toUpperCase();
    const room = io.sockets.adapter.rooms.get(cleanKey);

    if (!room) {
      return socket.emit("match-error", "Match Not Found");
    }

    if (room.size >= 2) {
      return socket.emit("match-error", "This match is already full!");
    }

    socket.join(cleanKey);
    socket.emit("match-joined", { matchKey, playerNumber: 2 });

    await database.joinMatch(cleanKey, socket.id);

    io.to(cleanKey).emit("match-ready", {
      message: "Both players connected.",
      matchKey: cleanKey,
    });
  });

  // ---- Challenge System ----------------------------------------

  /**
   * Challenger sends a challenge to a specific user by their socket ID.
   * The target receives a "challenge-received" event with the challenger name.
   */
  socket.on("send-challenge", async ({ targetSocketId }) => {
    const challenger = await database.getUser(socket.id);
    if (!challenger) return;

    const targetSocket = io.sockets.sockets.get(targetSocketId);
    if (!targetSocket) {
      return socket.emit("challenge-error", "That player is no longer online.");
    }

    // Server-side guard: reject if the target is already in a match
    const targetMatch = await database.getMatchBySocketId(targetSocketId);
    if (targetMatch) {
      return socket.emit("challenge-error", "That player is already in a match.");
    }

    io.to(targetSocketId).emit("challenge-received", {
      challengerSocketId: socket.id,
      challengerName: challenger.userName,
    });
  });

  /**
   * Target accepts a challenge.
   * Server creates the match, puts both sockets in the room, fires match-ready.
   */
  socket.on("accept-challenge", async ({ challengerSocketId }) => {
    const challengerSocket = io.sockets.sockets.get(challengerSocketId);
    if (!challengerSocket) {
      return socket.emit("challenge-error", "Challenger disconnected.");
    }

    const matchKey = await database.createMatch(challengerSocketId);

    challengerSocket.join(matchKey);
    socket.join(matchKey);

    await database.joinMatch(matchKey, socket.id);

    io.emit("update_users", {
      rooms: await database.getMatches(),
      users: await database.getUsersWithStatus(),
    });

    io.to(matchKey).emit("match-ready", {
      message: "Both players connected.",
      matchKey,
    });
  });

  /**
   * Target declines a challenge.
   * Challenger receives a "challenge-declined" notification.
   */
  socket.on("decline-challenge", async ({ challengerSocketId }) => {
    const decliner = await database.getUser(socket.id);
    io.to(challengerSocketId).emit("challenge-declined", {
      declinerName: decliner?.userName ?? "Your opponent",
    });
  });
}
