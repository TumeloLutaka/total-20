// ============================================================ \\
// entities/Card.js
// Responsible for the Card data shape and generating card data.
// ============================================================ \\

/**
 * Creates a single random card.
 * @returns {{ id: string, number: number, type: "blue" | "red" }}
 */
export function createCard() {
  const number = Math.floor(Math.random() * 10) + 1;
  const type = Math.floor(Math.random() * 2) + 1 === 1 ? "blue" : "red";
  return { id: crypto.randomUUID(), number, type };
}

/**
 * Generates a starting hand of random cards.
 * @param {number} size - Number of cards to generate (default 5).
 * @returns {Array<{ id: string, number: number, type: "blue" | "red" }>}
 */
export function createHand(size = 5) {
  const cards = [];
  for (let i = 0; i < size; i++) {
    cards.push(createCard());
  }
  return cards;
}
