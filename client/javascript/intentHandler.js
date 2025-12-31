import { sendIntent } from "./socketHandler.js";

export function drawCard() {
  sendIntent({
    action: "draw_card",
    nextPhase: "Main Phase",
  });
}

export function playCard(cardIndex) {
  sendIntent({
    action: "play_card",
    cardIndex,
  });
}
