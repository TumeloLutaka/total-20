const handCards = document.querySelectorAll(".player-hand .card-outer");
const opponentCards = document.querySelectorAll(".opponent-hand .card-outer");
const drawDeckCard = document.querySelector(".draw-deck .card-outer");
const pile1 = document.querySelector(".p1");
const pile2 = document.querySelector(".p2");

handCards.forEach((card) => {
  card.addEventListener("click", () => moveCard(card, pile1));
});

opponentCards.forEach((card) => {
  card.addEventListener("click", () => moveAndFlipOpponentCard(card, pile2));
});

drawDeckCard.addEventListener("click", () => {
  moveAndFlipCard(drawDeckCard, pile1);
});

function moveCard(card, targetPile) {
  const target = targetPile;
  console.log(target);

  const cardRect = card.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();

  card.style.position = "fixed";
  card.style.left = `${cardRect.left}px`;
  card.style.top = `${cardRect.top}px`;
  card.style.margin = "0";
  card.style.zIndex = "1000";

  document.body.appendChild(card);

  const deltaX =
    targetRect.left +
    targetRect.width / 2 -
    (cardRect.left + cardRect.width / 2);

  const deltaY =
    targetRect.top +
    targetRect.height / 2 -
    (cardRect.top + cardRect.height / 2);

  requestAnimationFrame(() => {
    card.style.transition = "transform 0.6s ease";
    card.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
  });

  card.addEventListener(
    "transitionend",
    () => {
      card.style.transition = "";
      card.style.transform = "";
      card.style.position = "";
      card.style.left = "";
      card.style.top = "";
      card.style.zIndex = "";

      // **Clear all existing children in the pile**
      targetPile.innerHTML = ""; // simple and effective

      targetPile.appendChild(card);
    },
    { once: true }
  );
}

function moveAndFlipCard(cardOuter, targetPile) {
  const target = targetPile.firstChild;
  console.log(targetPile);
  const cardInner = cardOuter.querySelector(".card-inner");

  // 1. Capture current bounding rect
  const cardRect = cardOuter.getBoundingClientRect();
  const pileRect = target.getBoundingClientRect();

  // 2. Detach & freeze position in viewport
  cardOuter.style.position = "fixed";
  cardOuter.style.left = `${cardRect.left}px`;
  cardOuter.style.top = `${cardRect.top}px`;
  cardOuter.style.margin = "0";
  cardOuter.style.zIndex = "1000";

  document.body.appendChild(cardOuter);

  // 3. Calculate translation
  const deltaX =
    pileRect.left + pileRect.width / 2 - (cardRect.left + cardRect.width / 2);
  const deltaY =
    pileRect.top + pileRect.height / 2 - (cardRect.top + cardRect.height / 2);

  // 4. Animate translation
  requestAnimationFrame(() => {
    cardOuter.style.transition = "transform 0.6s ease";
    cardOuter.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

    // 5. Trigger mid-flight flip at 50% of travel
    setTimeout(() => {
      cardInner.style.transform = "rotateY(180deg)";
    }, 300); // 0.6s total / 2
  });

  // 6. Cleanup after movement
  cardOuter.addEventListener(
    "transitionend",
    (e) => {
      // Ignore transitions from children (like card-inner flip)
      if (e.target !== cardOuter) return;

      // Ignore non-transform transitions (future-proofing)
      if (e.propertyName !== "transform") return;

      cardOuter.style.transition = "";
      cardOuter.style.transform = "";
      cardOuter.style.position = "";
      cardOuter.style.left = "";
      cardOuter.style.top = "";
      cardOuter.style.zIndex = "";

      // **Clear all existing children in the pile**
      targetPile.innerHTML = ""; // simple and effective

      targetPile.appendChild(cardOuter);
    },
    { once: true }
  );
}

function moveAndFlipOpponentCard(cardOuter, targetPile) {
  // Get the current child in the pile and set that as the target
  const target = targetPile.firstChild;

  const cardInner = cardOuter.querySelector(".card-inner");

  // 1. Capture bounding rects
  const cardRect = cardOuter.getBoundingClientRect();
  const pileRect = target.getBoundingClientRect();

  // 2. Detach & freeze
  cardOuter.style.position = "fixed";
  cardOuter.style.left = `${cardRect.left}px`;
  cardOuter.style.top = `${cardRect.top}px`;
  cardOuter.style.margin = "0";
  cardOuter.style.zIndex = "1000";

  document.body.appendChild(cardOuter);

  // 3. Flip immediately (but force frame)
  requestAnimationFrame(() => {
    cardInner.style.transition = "transform 0.6s ease";
    cardInner.style.transform = "rotateY(180deg)";
  });

  // 4. Calculate translation
  const deltaX =
    pileRect.left + pileRect.width / 2 - (cardRect.left + cardRect.width / 2);
  const deltaY =
    pileRect.top + pileRect.height / 2 - (cardRect.top + cardRect.height / 2);

  // 5. Animate movement after flip completes
  setTimeout(() => {
    cardOuter.style.transition = "transform 0.6s ease";
    cardOuter.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
  }, 700); // matches flip duration

  // 6. Cleanup
  setTimeout(() => {
    cardOuter.style.transition = "";
    cardOuter.style.transform = "";
    cardOuter.style.position = "";
    cardOuter.style.left = "";
    cardOuter.style.top = "";
    cardOuter.style.zIndex = "";

    targetPile.innerHTML = "";
    targetPile.appendChild(cardOuter);
  }, 1400); // flip (0.6s) + move (0.6s) + buffer
}
