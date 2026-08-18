import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { useGameEvents } from "../../hooks/useGameEvents";
import { GamePhases } from "../../../../Shared/enums";
import Card from "./Card/Card";
import GhostCard from "./Card/GhostCard";
import PlayCard from "./Card/PlayCard";
import OppCard from "./Card/OppCard";
import classes from "./game.module.css";

export default function Game({ socket }) {
  // ---- VARIABLES ---------------------------------------------\\
  let params = useParams();
  const matchKey = params.matchKey;
  const { animState, gameState } = useGameEvents(socket, matchKey);
  const isGameOver = gameState.phase === GamePhases.OVER;
  const navigate = useNavigate();

  const ghostCardRef = useRef(null);
  const opponentPileRef = useRef(null);
  const playerPileRef = useRef(null);

  useEffect(() => {
    const handleUnload = () => {
      socket.emit("leave-match", { matchKey });
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      socket.emit("leave-match", { matchKey });
    };
  }, [matchKey]);

  // ---- FUNCTIONS ---------------------------------------------\\
  const handleLeaveMatch = () => {
    // Fires when component unmounts
    socket.emit("leave-match", { matchKey: matchKey });
    navigate("/");
  };

  const handlePlayCard = (cardId) => {
    handlePlayerAction("PLAY_CARD", { cardId: cardId });
  };

  const handlePlayerAction = (actionType, data = {}) => {
    if (gameState.phase === GamePhases.OVER) return;

    switch (actionType) {
      case "DRAW_CARD": {
        if (gameState.phase !== GamePhases.NEXT) {
          return;
        }
        break;
      }
      case "END_TURN": {
        if (gameState.phase === GamePhases.DRAW) {
          return;
        }
        break;
      }
      case "LOCK_PLAY": {
        if (
          gameState.phase !== GamePhases.LOCK &&
          gameState.phase !== GamePhases.PLAY
        ) {
          return;
        }
        break;
      }
      case "NEXT_TURN": {
        if (gameState.phase === GamePhases.DRAW) {
          return;
        }
        break;
      }
      case "PLAY_CARD": {
        if (gameState.phase !== GamePhases.PLAY) {
          return;
        }
        break;
      }
    }

    const action = {
      matchKey: matchKey,
      type: actionType,
      data: data,
    };

    socket.emit("player-action", { action, data });
  };

  // ---- RENDERING ---------------------------------------------\\
  return (
    <main className={classes["game"]}>
      {isGameOver && (
        <GameOverPopup
          gameOverReason={gameState.gameOverReason}
          onReturnHome={handleLeaveMatch}
          player={gameState.player}
          opponent={gameState.opponent}
        />
      )}

      <div className={classes["game__board"]}>
        <PlayerBanner
          playerNumber={gameState.opponent.playerNumber}
          userName={gameState.opponent.userName}
          userPoints={gameState.opponent.points}
          userScore={gameState.opponent.score}
          userState={gameState.opponent.state}
        />

        <section className={classes["game__play-section"]}>
          {/* OPPONENT HAND */}
          <ul className={classes["game__opponent-hand"]}>
            {gameState.opponent.hand.map((cardId) => {
              return (
                <li key={cardId}>
                  <OppCard
                    animState={animState}
                    cardId={cardId}
                    opponentPileRef={opponentPileRef}
                  />
                </li>
              );
            })}
          </ul>

          <div className={classes["game__play-wrapper"]}>
            <div
              data-player={gameState.currentPlayerNumber}
              className={classes["game__phase-inidicator"]}
            >
              <p>
                Player {`${gameState.currentPlayerNumber}`} - {gameState.phase}
              </p>
            </div>

            <div className={classes["game__card-piles-wrapper"]}>
              <div className={classes["game__card-pile"]}>
                <Card
                  isHidden={!gameState.opponent?.pileTopCard}
                  number={gameState.opponent?.pileTopCard?.number || 0}
                  ref={opponentPileRef}
                  type={gameState.opponent?.pileTopCard?.type || "blue"}
                />
              </div>

              {<Card ref={ghostCardRef} side="back" />}
              <GhostCard
                animState={animState}
                ghostCardRef={ghostCardRef}
                opponentPileRef={opponentPileRef}
                playerPileRef={playerPileRef}
              />

              <div className={classes["game__card-pile"]}>
                <Card
                  isHidden={!gameState.player?.pileTopCard}
                  number={gameState.player?.pileTopCard?.number || 0}
                  ref={playerPileRef}
                  type={gameState.player?.pileTopCard?.type || "blue"}
                />
              </div>
            </div>
          </div>

          {/* PLAYER HAND */}
          <ul className={classes["game__player-hand"]}>
            {gameState?.player?.hand &&
              gameState.player.hand.map((card, index) => (
                <li key={card.id}>
                  <PlayCard
                    animState={animState}
                    card={card}
                    onPlayCard={() => handlePlayCard(card.id)}
                    playerPileRef={playerPileRef}
                  />
                </li>
              ))}
          </ul>
        </section>

        <PlayerBanner
          playerNumber={gameState?.player?.playerNumber}
          userName={gameState?.player?.userName}
          userPoints={gameState?.player?.points}
          userScore={gameState?.player?.score}
          userState={gameState?.player?.state}
        />

        <section className={classes["game__actions"]}>
          <button
            data-btn="info"
            className={classes["game__btn"]}
            onClick={() => handlePlayerAction("DRAW_CARD")}
          >
            Draw
          </button>
          <button
            className={classes["game__btn"]}
            onClick={() => handlePlayerAction("LOCK_PLAY")}
          >
            Lock
          </button>
          <button
            data-btn="ghost"
            className={classes["game__btn"]}
            onClick={() => handlePlayerAction("END_TURN")}
          >
            End Turn
          </button>
        </section>
      </div>
    </main>
  );
}

function GameOverPopup({ gameOverReason, onReturnHome, player, opponent }) {
  const messages = {
    match_end: { title: "Game Over", sub: "The match has ended." },
    opponent_left: {
      title: "Opponent Left",
      sub: "Your opponent disconnected.",
    },
  };

  const { title, sub } = messages[gameOverReason] ?? messages.match_end;

  return (
    <div className={classes["game__overlay"]}>
      <div className={classes["game__popup"]}>
        <p className={classes["game__popup-title"]}>{title}</p>
        <p className={classes["game__popup-reason"]}>{sub}</p>

        <div className={classes["game__popup-scores"]}>
          <ScoreCard player={opponent} />
          <p style={{ color: "white", fontSize: "20px", fontWeight: "bold" }}>
            VS
          </p>
          <ScoreCard player={player} />
        </div>

        <button
          data-btn="info"
          className={classes["game__btn"]}
          onClick={onReturnHome}
        >
          Return to Lobby
        </button>
      </div>
    </div>
  );
}

function PlayerAvatar({ fontSize = "20px", name = "?", playerNumber }) {
  return (
    <div
      data-player={playerNumber}
      className={classes["game__avatar"]}
      style={{ fontSize: `${fontSize}` }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function PlayerBanner({
  playerNumber,
  userName,
  userPoints,
  userScore,
  userState,
}) {
  return (
    <section className={classes["game__opponent-banner"]}>
      <div className={classes["game__player-details"]}>
        <PlayerAvatar
          fontSize="25px"
          name={userName}
          playerNumber={playerNumber}
        />
        <p style={{ gridArea: "name" }}>{userName}</p>
        <p className={classes["game__player-status"]}>{userState}</p>
      </div>
      <div>
        <p className={classes["game__score-indicator"]}>{userScore} </p>
        <p>
          {userPoints} pt{userPoints > 1 ? "s" : ""}
        </p>
      </div>
    </section>
  );
}

function ScoreCard({ player }) {
  return (
    <div
      data-winner={player?.points >= 2}
      className={classes["game__popup-score-card"]}
    >
      <p className={classes["game__popup-score-designation"]}>
        P{player?.playerNumber}
      </p>
      <PlayerAvatar
        name={player?.userName}
        playerNumber={player?.playerNumber}
      />
      <p className={classes["game__popup-score-name"]}>{player?.userName}</p>
      <span className={classes["game__popup-score-points"]}>
        {player?.points}
      </span>
    </div>
  );
}
