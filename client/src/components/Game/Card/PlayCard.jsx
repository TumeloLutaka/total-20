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

    const from = playCardRef.current.getBoundingClientRect();
    const to = playerPileRef.current.getBoundingClientRect();

    setStyle({
      position: "fixed",
      left: from.left,
      top: from.top,
      transition: "none",
      zIndex: 1000,
    });

    // 3. Queue the transition for the next available repaint cycles
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setStyle((prev) => ({
          ...prev,
          left: to.left,
          top: to.top,
          transition: "left 800ms ease-out, top 800ms ease-out",
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
