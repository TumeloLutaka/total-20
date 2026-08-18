import { useEffect } from "react";
import { useState } from "react";
import { useNavigate } from "react-router";

import classes from "./home.module.css";
import ThemeSwitcher from "../ThemeSwitcher/ThemeSwitcher";

export default function Home({ data, socket }) {
  // ---- VARIABLES ---------------------------------------------\\
  const [joinKey, setJoinKey] = useState("");
  const [matchKey, setMatchKey] = useState(null);
  const [user, setUser] = useState(null);

  const navigate = useNavigate();
  useEffect(() => {
    socket.emit("get-user-data");

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
    socket.on("user-data", ({ user }) => {
      console.log(user);
      setUser(user);
    });

    return () => {
      socket.off("match-created");
      socket.off("match-error");
      socket.off("match-joined");
      socket.off("match-ready");
      socket.off("user-data");
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
    <>
      <header
        className="container"
        style={{
          alignItems: "center",
          display: "flex",
          justifyContent: "space-between",
          paddingBlock: "var(--padding-500)",
        }}
      >
        <div
          className="logo"
          style={{
            alignItems: "center",
            display: "flex",
            fontSize: "18px",
            fontWeight: "bold",
          }}
        >
          <img src="/images/logo.svg" alt="" style={{ height: "50px" }} />
          {/* <p>TotalTwenty.</p> */}
        </div>
        <ThemeSwitcher />
      </header>

      <main className="container">
        <section className="profile">
          <h1 className="heading-1">
            Welcome,{" "}
            <span style={{ color: "var(--clr-primary-main)" }}>
              {user && user.userName}
            </span>
          </h1>
        </section>

        <section className={classes["match"]}>
          <div className={classes["match__wrapper"]}>
            <div className={classes["card"]}>
              <h2 className="heading-2">Create a Match</h2>
              <div className={classes["match__create-wrapper"]}>
                <p className={classes["match__create-key"]}>
                  Match Key: {matchKey && matchKey}
                </p>
                <button className="btn" onClick={handleCreateRoom}>
                  Create Match
                </button>
              </div>
            </div>

            <div className={classes["card"]}>
              <h2 className="heading-2">Join Match</h2>
              <form
                onSubmit={(e) => handleSubmitJoin(e)}
                style={{ display: "grid", gap: "var(--sizing-300)" }}
              >
                <input
                  onChange={(e) => {
                    setJoinKey(e.target.value);
                  }}
                  placeholder="Enter a room code"
                  type="text"
                  value={joinKey}
                />
                <button className="btn" type="submit">
                  Join Match
                </button>
              </form>
            </div>
          </div>

          {!data?.users && "Loading users..."}
          <table>
            <caption className="heading-2">Online Users</caption>
            <tr style={{ fontWeight: "bold" }}>
              <th>Name</th>
              {/* <th>Invite</th> */}
            </tr>
            {data?.users &&
              data.users.map((user) => (
                <tr key={user.socketId}>
                  <td>{user.userName}</td>
                  <td>
                    {/* <button className="btn" style={{ fontSize: "12px" }}>
                      invite
                    </button> */}
                  </td>
                </tr>
              ))}
          </table>
        </section>

        {/* <section className={`${classes["matches"]} ${classes["card"]}`}>
          <table>
            <caption className="heading-2">Avaliable Rooms</caption>
            <tr>
              <th>Room Key</th>
            </tr>
            {!data?.rooms && "Loading rooms..."}
            {data?.rooms &&
              data.rooms.map((r) => (
                <tr>
                  <td>{r.matchKey}</td>
                </tr>
              ))}
          </table>
        </section> */}
      </main>
    </>
  );
}
