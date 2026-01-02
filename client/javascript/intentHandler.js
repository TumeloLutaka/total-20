import { sendIntent } from "./socketHandler.js";
import { ActionPhases } from "../shared/actionPhases.js";

export function drawCard() {
  sendIntent({
    action: ActionPhases.DRAW_PHASE,
    nextPhase: ActionPhases.PLAY_PHASE,
  });
}

export function endTurn() {
  sendIntent({
    action: ActionPhases.END_PHASE,
  });
}

export function handleUpkeep() {
  sendIntent({
    action: ActionPhases.UPKEEP_PHASE,
    nextPhase: ActionPhases.DRAW_PHASE,
  });
}

export function playCard(cardIndex) {
  sendIntent({
    action: ActionPhases.PLAY_PHASE,
    nextPhase: ActionPhases.END_PHASE,
    cardIndex,
  });
}

export function standUser() {
  sendIntent({
    action: ActionPhases.STAND_USER,
  });
}