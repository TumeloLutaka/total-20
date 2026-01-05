export function moveCard(card, targetPile) {
  return new Promise((resolve) => {
    console.log(targetPile);
    const target = targetPile.children[0];

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

    setTimeout(() => {
      card.style.transition = "";
      card.style.transform = "";
      card.style.position = "";
      card.style.left = "";
      card.style.top = "";
      card.style.zIndex = "";

      targetPile.innerHTML = "";
      targetPile.appendChild(card);

      resolve();
    }, 650); // 600ms animation + 50ms buffer
  });
}

export function moveAndFlipCard(cardOuter, targetPile) {
  return new Promise((resolve) => {
    const target = targetPile.children[0];
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

    // 6. Cleanup after animation completes
    setTimeout(() => {
      cardOuter.style.transition = "";
      cardOuter.style.transform = "";
      cardOuter.style.position = "";
      cardOuter.style.left = "";
      cardOuter.style.top = "";
      cardOuter.style.zIndex = "";

      targetPile.innerHTML = "";
      targetPile.appendChild(cardOuter);

      resolve();
    }, 650); // 600ms animation + 50ms buffer
  });
}

export function moveAndFlipOpponentCard(cardOuter, targetPile) {
  return new Promise((resolve) => {
    // Get the current child in the pile and set that as the target
    const target = targetPile.children[0];
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
    }, 700); // matches flip duration + buffer

    // 6. Cleanup after all animations complete
    setTimeout(() => {
      cardOuter.style.transition = "";
      cardOuter.style.transform = "";
      cardOuter.style.position = "";
      cardOuter.style.left = "";
      cardOuter.style.top = "";
      cardOuter.style.zIndex = "";

      targetPile.innerHTML = "";
      targetPile.appendChild(cardOuter);

      resolve();
    }, 1400); // flip (600ms) + delay (100ms) + move (600ms) + buffer (100ms)
  });
}

export function showEndTurnIndicator(indicator, isCaller) {
  return new Promise((resolve) => {
    // Set up the listener FIRST
    indicator.addEventListener('animationend', (event) => {
      // Remove the class so it can be re-triggered later
      indicator.classList.remove('animate-phase', "opponent");
      
      // IMPORTANT: Resolve inside here so the game waits for the animation
      resolve(); 
    }, { once: true });

    const indicatorText = indicator.querySelector(".player-indicator-text")
    indicatorText.textContent = "Turn End"

    if(isCaller)
        indicator.classList.add("opponent")


    // Trigger the animation
    // Note: 'classList' must have a capital 'L'
    indicator.classList.add('animate-phase');
  });
}

export function showPlayerTurnIndicator(indicator, isCaller) {
  return new Promise((resolve) => {
    // Set up the listener FIRST
    indicator.addEventListener('animationend', (event) => {
      // Remove the class so it can be re-triggered later
      indicator.classList.remove('animate-phase', "opponent");
      
      // IMPORTANT: Resolve inside here so the game waits for the animation
      resolve(); 
    }, { once: true });

    const indicatorText = indicator.querySelector(".player-indicator-text")
    const text = isCaller ? "Your Turn" : "Opponent's Turn"
    indicatorText.textContent = text

    if(!isCaller)
        indicator.classList.add("opponent")


    // Trigger the animation
    // Note: 'classList' must have a capital 'L'
    indicator.classList.add('animate-phase');
  });}

export function showStandingUserIndicator(indicator, isCaller) {
  return new Promise((resolve) => {
    // Set up the listener FIRST
    indicator.addEventListener('animationend', (event) => {
      // Remove the class so it can be re-triggered later
      indicator.classList.remove('animate-phase', "opponent");
      
      // IMPORTANT: Resolve inside here so the game waits for the animation
      resolve(); 
    }, { once: true });

    const indicatorText = indicator.querySelector(".player-indicator-text")
    const text = isCaller ? "You Stand" : "Opponent Stands"
    indicatorText.textContent = text

    if(!isCaller)
        indicator.classList.add("opponent")


    // Trigger the animation
    // Note: 'classList' must have a capital 'L'
    indicator.classList.add('animate-phase');
  });

}