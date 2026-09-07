import { useEffect, useRef, useState } from "react";
import Card from "./Card";

export default function OppCard({ animState, cardId, opponentPileRef }) {
  // ---- VARIABLES ---------------------------------------------\\
  const [number, setNumber] = useState(0);
  const [side, setSide] = useState("back");
  const [style, setStyle] = useState({});
  const [type, setType] = useState("blue");

  const oppoCardRef = useRef(null);

  useEffect(() => {
    if (animState?.animationType !== "PLAY_CARD") return;
    if (animState?.playedCard.id !== cardId) return;

    // Use offsetParent-relative coords (same approach as GhostCard) so that
    // backdrop-filter / stacking contexts on parent elements don't offset us.
    const parentEl = oppoCardRef.current.offsetParent || document.body;
    const parentRect = parentEl.getBoundingClientRect();
    const from = oppoCardRef.current.getBoundingClientRect();

    setStyle({
      position: "absolute",
      left: from.left - parentRect.left,
      top: from.top - parentRect.top,
      width: from.width,
      height: from.height,
      transition: "none",
      zIndex: 1000,
      pointerEvents: "none",
    });

    setNumber(animState.playedCard.number);
    setType(animState.playedCard.type);
    setSide("front");
  }, [animState]);

  // ---- FUNCTIONS ---------------------------------------------\\
  const handleFlipEnd = () => {
    const parentEl = oppoCardRef.current.offsetParent || document.body;
    const parentRect = parentEl.getBoundingClientRect();
    const to = opponentPileRef.current.getBoundingClientRect();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setStyle((s) => ({
          ...s,
          left: `${to.left - parentRect.left}px`,
          top: `${to.top - parentRect.top}px`,
          transition:
            "left 500ms ease-out, top 500ms ease-out, transform 500ms ease-out",
        }));
      });
    });
  };

  const handleTransitionEnd = (e) => {
    if (e.propertyName === "left") {
      setTimeout(() => {
        animState.notifyAnimationComplete();
      }, 200);
    }
  };

  // ---- RENDERING ---------------------------------------------\\
  return (
    <div onTransitionEnd={handleTransitionEnd} ref={oppoCardRef} style={style}>
      <Card number={number} onFlipEnd={handleFlipEnd} side={side} type={type} />
    </div>
  );
}
