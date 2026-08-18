import classes from "./card.module.css";

export default function Card({
  isHidden = false,
  number = 0,
  onFlipEnd,
  ref = null,
  side = "front",
  type = "black",
}) {
  const handleTransitionEnd = (e) => {
    // Crucial check: ignore background, opacity, etc. Only care about transform!
    if (e.propertyName === "transform") {
      // If a callback prop was passed, trigger it
      onFlipEnd();
    }
  };

  return (
    <article
      className={classes["card"]}
      data-flipped={side}
      data-hidden={isHidden}
      data-type={type}
      ref={ref}
    >
      <div
        className={classes["card__content"]}
        onTransitionEnd={handleTransitionEnd}
      >
        <div className={classes["card__front"]}>
          <span>
            {type === "red" ? "-" : "+"}
            {number}
          </span>
          <span>{number}</span>
          <span>
            {type === "red" ? "-" : "+"}
            {number}
          </span>
        </div>
        <div className={classes["card__back"]}>
          <img src="/images/logo.svg" />
        </div>
      </div>
    </article>
  );
}
