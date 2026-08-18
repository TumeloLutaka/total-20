import { useEffect, useRef, useState } from "react";
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

  // Preload the audio instance once per card lifecycle
  const flipSfxRef = useRef(new Audio("/audio/sfx/card-flick.wav"));
  const placeSfxRef = useRef(new Audio("/audio/sfx/card-placement.wav"));

  useEffect(() => {
    if (animState?.animationType !== "DRAW_CARD") return;

    const parentRect =
      ghostCardRef.current.offsetParent.getBoundingClientRect();
    const from = ghostCardRef.current.getBoundingClientRect();

    setStyle({
      left: from.left - parentRect.left,
      position: "absolute",
      top: from.top - parentRect.top,
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
      // Play SFX on flip completion
      if (placeSfxRef.current) {
        placeSfxRef.current.volume = 0.4;
        placeSfxRef.current.currentTime = 0; // Reset for rapid flips
        placeSfxRef.current.play().catch(() => {});
      }

      animState.notifyAnimationComplete();

      setStyle((prev) => {
        return { ...prev, opacity: 0 };
      });
      setSide("back");
    }
  };

  const handleFlipEnd = () => {
    const selectedPileRef = animState.isPlayerAction
      ? playerPileRef
      : opponentPileRef;

    // Get both target pile rect AND shared offsetParent rect
    const targetEl = selectedPileRef.current;
    const parentEl = ghostCardRef.current.offsetParent || document.body;

    const to = targetEl.getBoundingClientRect();
    const parentRect = parentEl.getBoundingClientRect();

    if (flipSfxRef.current) {
      flipSfxRef.current.volume = 0.4;
      flipSfxRef.current.currentTime = 0;
      flipSfxRef.current.play().catch(() => {});
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setStyle((s) => ({
          ...s,
          left: `${to.left - parentRect.left}px`, // <--- Subtracted parentRect!
          top: `${to.top - parentRect.top}px`, // <--- Subtracted parentRect!
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
