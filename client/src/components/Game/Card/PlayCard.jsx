import { useEffect, useRef, useState } from "react";
import Card from "./Card";

export default function PlayCard({
  animState,
  card,
  onPlayCard,
  playerPileRef,
}) {
  const [style, setStyle] = useState({});

  const playCardRef = useRef(null);

  useEffect(() => {
    if (animState?.animationType !== "PLAY_CARD") return;
    if (animState?.playedCard.id !== card.id) return;

    // Use offsetParent-relative coords to avoid backdrop-filter offset issues.
    const parentEl = playCardRef.current.offsetParent || document.body;
    const parentRect = parentEl.getBoundingClientRect();
    const from = playCardRef.current.getBoundingClientRect();
    const to = playerPileRef.current.getBoundingClientRect();

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

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setStyle((prev) => ({
          ...prev,
          left: `${to.left - parentRect.left}px`,
          top: `${to.top - parentRect.top}px`,
          transition: "left 500ms ease-out, top 500ms ease-out",
        }));
      });
    });
  }, [animState]);

  const handleTransitionEnd = (e) => {
    if (e.propertyName === "left") {
      setTimeout(() => {
        animState.notifyAnimationComplete();
      }, 200);
    }
  };

  return (
    <div
      onClick={onPlayCard}
      onTransitionEnd={handleTransitionEnd}
      ref={playCardRef}
      style={style}
    >
      <Card number={card.number} type={card.type} />
    </div>
  );
}
