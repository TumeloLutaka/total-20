import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";

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
  const [flight, setFlight] = useState(null);

  const ghostCardRef = useRef(null);
  const opponentPileRef = useRef(null);
  const playerPileRef = useRef(null);

  // ---- FUNCTIONS ---------------------------------------------\\
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
      <div className={classes["game__board"]}>
        <PlayerBanner
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
            <div className={classes["game__phase-inidicator"]}>
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

function PlayerAvatar({ name = "?" }) {
  return (
    <p className={classes["game__avatar"]}>{name.charAt(0).toUpperCase()}</p>
  );
}

function PlayerBanner({ userName, userPoints, userScore, userState }) {
  return (
    <section className={classes["game__opponent-banner"]}>
      <div className={classes["game__player-details"]}>
        <PlayerAvatar name={userName} />
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
