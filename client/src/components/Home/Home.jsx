import { useState } from "react";

import classes from "./home.module.css";
import ThemeSwitcher from "../ThemeSwitcher/ThemeSwitcher";
import { useMatchEvents } from "../../delivery/socket/useMatchEvents";

export default function Home({ data, socket }) {
  // ---- VARIABLES ---------------------------------------------\\
  const [joinKey, setJoinKey] = useState("");
  const {
    matchKey,
    user,
    incomingChallenge,
    handleCreateMatch,
    handleJoinMatch,
    handleSendChallenge,
    handleAcceptChallenge,
    handleDeclineChallenge,
  } = useMatchEvents(socket);

  // ---- FUNCTIONS ---------------------------------------------\\
  const handleSubmitJoin = (e) => {
    e.preventDefault();
    handleJoinMatch(joinKey);
  };

  // ---- RENDERING ---------------------------------------------\\
  return (
    <>
      {/* Incoming Challenge Modal */}
      {incomingChallenge && (
        <div className={classes["challenge-overlay"]}>
          <div className={classes["challenge-modal"]}>
            <p className={classes["challenge-modal__title"]}>
              ⚔️ Challenge Received
            </p>
            <p className={classes["challenge-modal__name"]}>
              {incomingChallenge.challengerName}
            </p>
            <p className={classes["challenge-modal__sub"]}>
              wants to play against you
            </p>
            <div className={classes["challenge-modal__actions"]}>
              <button
                className="btn"
                data-variant="accept"
                onClick={() =>
                  handleAcceptChallenge(incomingChallenge.challengerSocketId)
                }
              >
                Accept
              </button>
              <button
                className="btn"
                data-variant="decline"
                onClick={() =>
                  handleDeclineChallenge(incomingChallenge.challengerSocketId)
                }
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

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
                <button className="btn" onClick={handleCreateMatch}>
                  Create Match
                </button>
              </div>
            </div>

            <div className={classes["card"]}>
              <h2 className="heading-2">Join Match</h2>
              <form
                onSubmit={handleSubmitJoin}
                style={{ display: "grid", gap: "var(--sizing-300)" }}
              >
                <input
                  onChange={(e) => setJoinKey(e.target.value)}
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
            <thead>
              <tr style={{ fontWeight: "bold" }}>
                <th>Name</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data?.users &&
                data.users.map((onlineUser) => (
                  <tr key={onlineUser.socketId}>
                    <td>{onlineUser.userName}</td>
                    <td className={classes["user-table__actions"]}>
                      {/* Don't show a challenge button for yourself */}
                      {onlineUser.socketId !== user?.socketId && (
                        <button
                          className={classes["challenge-btn"]}
                          disabled={onlineUser.inMatch}
                          data-in-match={onlineUser.inMatch}
                          onClick={() =>
                            handleSendChallenge(onlineUser.socketId)
                          }
                          title={
                            onlineUser.inMatch
                              ? `${onlineUser.userName} is currently in a match`
                              : `Challenge ${onlineUser.userName}`
                          }
                        >
                          {onlineUser.inMatch ? "In Match" : "⚔️ Challenge"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>
      </main>
    </>
  );
}
