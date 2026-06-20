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

    const from = oppoCardRef.current.getBoundingClientRect();
    setStyle({
      position: "fixed",
      left: from.left,
      top: from.top,
      transition: "none",
      zIndex: 1000,
    });

    setNumber(animState.playedCard.number);
    setType(animState.playedCard.type);
    setSide("front");
  }, [animState]);

  // ---- FUNCTIONS ---------------------------------------------\\
  const handleFlipEnd = () => {
    const to = opponentPileRef.current.getBoundingClientRect();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setStyle((s) => ({
          ...s,
          left: to.left,
          top: to.top,
          transition:
            "left 800ms ease-out, top 800ms ease-out, transform 800ms ease-out",
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
