// useGameEvents.js
import { useEffect, useRef, useState } from "react";
import { GamePhases, PlayerState } from "../../../Shared/enums";

const initialGameState = {
  currentPlayerNumber: 1,
  gameOverReason: null,
  opponent: {
    hand: [],
    pileTopCard: null,
    playerNumber: null,
    points: 0,
    score: 0,
    state: PlayerState.LIVE,
    userName: "loading...",
  },
  phase: GamePhases.INIT,
  player: null,
  playerNumber: 1,
};

export function useGameEvents(socket, matchKey) {
  const [animState, setAnimState] = useState({});
  const [gameState, setGameState] = useState(initialGameState);

  const animationResolverRef = useRef(null);
  const eventQueue = useRef([]);
  const isProcessing = useRef(false);
  const playerNumberRef = useRef(null);

  useEffect(() => {
    socket.emit("init-game", matchKey);
  }, [socket, matchKey]);

  useEffect(() => {
    const handleGameEvent = (event) => {
      eventQueue.current.push(event);
      if (!isProcessing.current) processNextEvent();
    };

    socket.on("game-event", handleGameEvent);
    return () => socket.off("game-event", handleGameEvent);
  }, [socket]);

  const processNextEvent = async () => {
    if (eventQueue.current.length === 0) {
      isProcessing.current = false;
      return;
    }

    isProcessing.current = true;
    const nextEvent = eventQueue.current.shift();
    console.log(nextEvent);
    await playAnimation(nextEvent, 1000);
    playEvent(nextEvent);
    processNextEvent();
  };

  const playEvent = (event) => {
    const payload = event.payload;

    switch (event.type) {
      case "AUTO_PLAY": {
        setGameState((prev) => ({ ...prev, phase: payload.phase }));
        GamePhases;
        break;
      }

      case "DRAW_CARD": {
        setGameState((prev) => {
          const key =
            prev.player?.playerNumber === payload.playerNumber
              ? "player"
              : "opponent";

          return {
            ...prev,
            [key]: {
              ...prev[key],
              score: payload.newScoreTotal,
              pileTopCard: payload.drawnCard,
              state: payload.state,
            },
            phase: payload.phase,
          };
        });
        break;
      }

      case "END_TURN":
      case "AUTO_END_TURN": {
        setGameState((prev) => ({ ...prev, phase: payload.phase }));
        break;
      }

      case "GAME_INIT": {
        playerNumberRef.current = payload.player.playerNumber;

        setGameState((prev) => ({
          ...prev,
          opponent: {
            ...prev.opponent,
            hand: payload.opponent.hand,
            playerNumber: playerNumberRef.current === 1 ? 2 : 1,
            userName: payload.opponent.userName,
          },
          phase: payload.phase,
          player: payload.player,
        }));
        break;
      }

      case "LOCK_PLAY":
      case "AUTO_LOCK_PLAY": {
        setGameState((prev) => {
          const key =
            prev.player?.playerNumber === payload.currentPlayerNumber
              ? "player"
              : "opponent";

          return {
            ...prev,
            [key]: { ...prev[key], state: PlayerState.LOCK },
          };
        });
        break;
      }

      case "MATCH_END": {
        setGameState((prev) => ({
          ...prev,
          gameOverReason: "match_end",
          phase: GamePhases.OVER,
        }));
        break;
      }

      case "NEXT_TURN": {
        setGameState((prev) => ({
          ...prev,
          currentPlayerNumber: payload.currentPlayerNumber,
          phase: payload.phase,
        }));
        break;
      }

      case "OPPONENT_DISCONNECTED":
      case "OPPONENT_LEFT": {
        setGameState((prev) => {
          return {
            ...prev,
            gameOverReason: "opponent_left",
            phase: GamePhases.OVER,
          };
        });
        break;
      }

      case "PLAY_CARD": {
        setGameState((prev) => {
          const key =
            prev.player?.playerNumber === payload.playerNumber
              ? "player"
              : "opponent";

          console.log(payload);
          return {
            ...prev,
            [key]: {
              ...prev[key],
              hand: payload.hand,
              pileTopCard: payload.playedCard,
              score: payload.newScoreTotal,
              state: payload.state,
            },
            phase: payload.phase,
          };
        });
        break;
      }

      case "PLAY_TURN": {
        setGameState((prev) => ({ ...prev, phase: payload.phase }));
        break;
      }

      case "ROUND_END": {
        setGameState((prev) => ({
          ...prev,
          opponent: { ...prev.opponent, score: 0, state: PlayerState.LIVE },
          player: { ...prev.player, score: 0, state: PlayerState.LIVE },
          phase: payload.phase,
        }));
        break;
      }

      case "ROUND_WON": {
        setGameState((prev) => {
          const key =
            prev.player?.playerNumber === payload.playerNumber
              ? "player"
              : "opponent";

          return {
            ...prev,
            [key]: { ...prev[key], points: payload.newPointsTotal },
          };
        });
        break;
      }

      case "TIE_ROUND": {
        setGameState((prev) => ({ ...prev, phase: payload.phase }));
        break;
      }
    }
  };

  const playAnimation = (event, timeoutMs = 1500) => {
    const payload = event.payload;

    switch (event.type) {
      case "DRAW_CARD": {
        setAnimState({
          animationType: event.type,
          drawnCard: payload.drawnCard,
          isPlayerAction: payload.playerNumber === playerNumberRef.current,
          notifyAnimationComplete() {
            if (animationResolverRef.current) {
              animationResolverRef.current();
              animationResolverRef.current = null;
            }
          },
        });
        break;
      }

      case "GAME_INIT": {
        return new Promise((resolve) => {
          resolve();
        });
        break;
      }

      case "OPPONENT_LEFT":
      case "OPPONENT_DISCONNECTED": {
        return new Promise((resolve) => {
          resolve();
        });
        break;
      }

      case "PLAY_CARD": {
        setAnimState({
          animationType: event.type,
          playedCard: payload.playedCard,
          isPlayerAction: payload.playerNumber === playerNumberRef.current,
          notifyAnimationComplete() {
            if (animationResolverRef.current) {
              animationResolverRef.current();
              animationResolverRef.current = null;
            }
          },
        });
        break;
      }

      case "ROUND_WON": {
        setAnimState({
          animationType: event.type,
          playerNumber: payload.playerNumber,
          points: payload.newPointsTotal,
          isPlayerAction: payload.playerNumber === playerNumberRef.current,
        });
        break;
      }
    }

    return new Promise((resolve, reject) => {
      animationResolverRef.current = resolve;
      setTimeout(() => {
        if (animationResolverRef.current === resolve) {
          animationResolverRef.current = null;
          resolve();
        }
      }, timeoutMs);
    });
  };

  return {
    gameState,
    animState,
  };
}
