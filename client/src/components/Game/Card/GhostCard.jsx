import { useEffect, useState } from "react";
import Card from "./Card";

export default function GhostCard({
  animState,
  ghostCardRef,
  opponentPileRef,
  playerPileRef,
}) {
  // ---- VARIABLES ---------------------------------------------\\
  const [number, setNumber] = useState(0);
  const [side, setSide] = useState("back");
  const [style, setStyle] = useState({ position: "fixed", opacity: 0 });

  useEffect(() => {
    if (animState?.animationType !== "DRAW_CARD") return;

    const from = ghostCardRef.current.getBoundingClientRect();

    setStyle({
      left: from.left,
      position: "fixed",
      top: from.top,
      width: from.width,
      height: from.height,
      transition: "none",
      zIndex: 1000,
      pointerEvents: "none",
    });

    setNumber(animState.drawnCard.number);
    setSide("front");
  }, [animState]);

  // ---- FUNCTIONS ---------------------------------------------\\
  const handleTransitionEnd = (e) => {
    // Only fire when the flight position finishes moving
    if (e.propertyName === "left") {
      animState.notifyAnimationComplete();

      setStyle((prev) => {
        return { ...prev, opacity: 0 };
      });
      setSide("back");
    }
  };

  const handleFlipEnd = () => {
    // Figure out who is drawing, player or opponent.
    const selectedPileRef = animState.isPlayerAction
      ? playerPileRef
      : opponentPileRef;

    const to = selectedPileRef.current.getBoundingClientRect();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setStyle((s) => ({
          ...s,
          left: to.left,
          top: to.top,
          transition:
            "left 320ms ease-out, top 320ms ease-out, transform 320ms ease-out",
        }));
      });
    });
  };

  // ---- RENDERING ---------------------------------------------\\
  return (
    <div onTransitionEnd={handleTransitionEnd} style={style}>
      <Card
        number={number}
        onFlipEnd={handleFlipEnd}
        side={side}
        type={"black"}
      />
    </div>
  );
}
