// ============================================================ \\
// entities/Player.js
// Represents a player in a game — their hand, score, and state.
// ============================================================ \\
import { PlayerState } from "../../../Shared/entities/enums.js";
import { createHand } from "./Card.js";

export class Player {
  constructor(playerNumber, socketId, userName) {
    this.hand = createHand();
    this.userName = userName;
    this.pileTopCard = null;
    this.playerNumber = playerNumber;
    this.currentPlayerNumber = 1;
    this.points = 0;
    this.score = 0;
    this.socketId = socketId;
    this.state = PlayerState.LIVE;
  }

  static fromData(data) {
    const player = new Player(data.playerNumber, data.socketId, data.userName);

    player.hand = data.hand;
    player.pileTopCard = data.pileTopCard;
    player.currentPlayerNumber = data.currentPlayerNumber;
    player.points = data.points;
    player.score = data.score;
    player.state = data.state;

    return player;
  }

  /** Returns an array of card IDs only (sent to the opponent so they cannot see card values). */
  getHandIds() {
    return this.hand.map((card) => card.id);
  }
}
