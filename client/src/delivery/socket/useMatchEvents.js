// ============================================================ \\
// delivery/socket/useMatchEvents.js
// Boundary: wires match lifecycle socket events to React state.
// Home.jsx calls this hook — keeping the component purely UI.
// ============================================================ \\
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

/**
 * @param {import("socket.io-client").Socket} socket
 * @returns {{
 *   matchKey: string|null,
 *   user: object|null,
 *   incomingChallenge: { challengerSocketId: string, challengerName: string }|null,
 *   handleCreateMatch: Function,
 *   handleJoinMatch: Function,
 *   handleSendChallenge: Function,
 *   handleAcceptChallenge: Function,
 *   handleDeclineChallenge: Function,
 * }}
 */
export function useMatchEvents(socket) {
  const [matchKey, setMatchKey] = useState(null);
  const [user, setUser] = useState(null);
  const [incomingChallenge, setIncomingChallenge] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    socket.emit("get-user-data");

    socket.on("match-created", (key) => setMatchKey(key));
    socket.on("match-error", (message) => alert(message));
    socket.on("match-joined", (data) => {
      console.log(
        `Match ${data.matchKey} joined successfully, you are player ${data.playerNumber}`,
      );
    });
    socket.on("match-ready", (data) => {
      console.log(data.message);
      navigate("/game-board/" + data.matchKey);
    });
    socket.on("user-data", ({ user }) => {
      console.log(user);
      setUser(user);
    });

    // Challenge events
    socket.on("challenge-received", (data) => {
      setIncomingChallenge(data);
    });
    socket.on("challenge-declined", ({ declinerName }) => {
      alert(`${declinerName} declined your challenge.`);
    });
    socket.on("challenge-error", (message) => {
      alert(message);
    });

    return () => {
      socket.off("match-created");
      socket.off("match-error");
      socket.off("match-joined");
      socket.off("match-ready");
      socket.off("user-data");
      socket.off("challenge-received");
      socket.off("challenge-declined");
      socket.off("challenge-error");
    };
  }, [socket]);

  const handleCreateMatch = () => socket.emit("create_match");

  const handleJoinMatch = (joinKey) => socket.emit("join-match", joinKey);

  const handleSendChallenge = (targetSocketId) =>
    socket.emit("send-challenge", { targetSocketId });

  const handleAcceptChallenge = (challengerSocketId) => {
    setIncomingChallenge(null);
    socket.emit("accept-challenge", { challengerSocketId });
  };

  const handleDeclineChallenge = (challengerSocketId) => {
    setIncomingChallenge(null);
    socket.emit("decline-challenge", { challengerSocketId });
  };

  return {
    matchKey,
    user,
    incomingChallenge,
    handleCreateMatch,
    handleJoinMatch,
    handleSendChallenge,
    handleAcceptChallenge,
    handleDeclineChallenge,
  };
}
