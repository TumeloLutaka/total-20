import { useEffect } from "react";
import { useState } from "react";
import { useNavigate } from "react-router";

export default function Home({ data, socket }) {
  // ---- VARIABLES ---------------------------------------------\\
  const [joinKey, setJoinKey] = useState("");
  const [matchKey, setMatchKey] = useState(null);

  const navigate = useNavigate();

  console.log(data);

  useEffect(() => {
    socket.on("match-created", (matchKey) => setMatchKey(matchKey));
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

    return () => {
      socket.off("match-created");
      socket.off("match-error");
      socket.off("match-joined");
      socket.off("match-ready");
    };
  }, [socket]);

  // ---- FUNCTIONS ---------------------------------------------\\
  const handleCreateRoom = (e) => {
    socket.emit("create_match");
  };

  const handleSubmitJoin = (e) => {
    e.preventDefault();
    socket.emit("join-match", joinKey);
  };

  // ---- RENDERING ---------------------------------------------\\
  return (
    <section className="hero">
      <h1>Home</h1>
      <h2>Create a Match</h2>

      <button onClick={handleCreateRoom}>Create Room</button>

      <form onSubmit={(e) => handleSubmitJoin(e)}>
        <input
          onChange={(e) => {
            setJoinKey(e.target.value);
          }}
          placeholder="Enter a room code"
          type="text"
          value={joinKey}
        />
        <button type="submit">Join Match</button>
      </form>

      {matchKey && <h3>Match Created: {matchKey}</h3>}

      <div className="">
        <div className="">
          <h3>Users</h3>
          {!data?.rooms && "Loading users..."}
          {data?.users && data.users.map((user) => <p>{user.id}</p>)}
        </div>
        <div className="">
          <h3>Avaliable Rooms</h3>
          {!data?.rooms && "Loading rooms..."}
          {data?.rooms && data.rooms.map((r) => <p>{r.matchKey}</p>)}
        </div>
      </div>
    </section>
  );
}
