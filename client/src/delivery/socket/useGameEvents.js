// ============================================================ \\
// delivery/socket/useGameEvents.js
// Boundary: wires the socket to React state.
// Manages the event queue to ensure events are processed in
// order, and handles animation timing between events.
// Business logic is delegated to the gameEventProcessor interactor.
// ============================================================ \\
import { useEffect, useRef, useState } from "react";
import { initialGameState } from "../../entities/gameState.js";
import { processGameEvent } from "../../interactors/gameEventProcessor.js";

export function useGameEvents(socket, matchKey) {
  const [animState, setAnimState] = useState({});
  const [gameState, setGameState] = useState(initialGameState);

  const animationResolverRef = useRef(null);
  const eventQueue = useRef([]);
  const isProcessing = useRef(false);
  const playerNumberRef = useRef(null);

  // Ask the server to send the initial game state
  useEffect(() => {
    socket.emit("init-game", matchKey);
  }, [socket, matchKey]);

  // Receive and queue incoming events
  useEffect(() => {
    const handleGameEvent = (event) => {
      eventQueue.current.push(event);
      if (!isProcessing.current) processNextEvent();
    };

    socket.on("game-event", handleGameEvent);
    return () => socket.off("game-event", handleGameEvent);
  }, [socket]);

  // ---- Private: event queue processor --------------------------

  const processNextEvent = async () => {
    if (eventQueue.current.length === 0) {
      isProcessing.current = false;
      return;
    }

    isProcessing.current = true;
    const nextEvent = eventQueue.current.shift();
    console.log(nextEvent);

    // Cache the player number once we get GAME_INIT
    if (nextEvent.type === "GAME_INIT") {
      playerNumberRef.current = nextEvent.payload.player.playerNumber;
    }

    await playAnimation(nextEvent, 1000);
    processGameEvent(nextEvent, playerNumberRef.current, setGameState);
    processNextEvent();
  };

  // ---- Private: animation layer --------------------------------

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

      case "GAME_INIT":
      case "OPPONENT_LEFT":
      case "OPPONENT_DISCONNECTED": {
        return Promise.resolve();
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

    return new Promise((resolve) => {
      animationResolverRef.current = resolve;
      setTimeout(() => {
        if (animationResolverRef.current === resolve) {
          animationResolverRef.current = null;
          resolve();
        }
      }, timeoutMs);
    });
  };

  return { gameState, animState };
}
