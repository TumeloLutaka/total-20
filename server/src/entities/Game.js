// ============================================================ \\
// entities/Game.js
// Core game entity — manages phase, players, and game rules.
// ============================================================ \\
import { GamePhases, PlayerState } from "../../../Shared/entities/enums.js";
import { Player } from "./Player.js";

export class Game {
  constructor() {
    this.currentPlayerNumber = 1;
    this.phase = GamePhases.NEXT;
    this.player1 = null;
    this.player2 = null;
  }

  static fromData(data) {
    const game = new Game();

    const legacyPhaseMap = {
      "New Turn": GamePhases.NEXT,
      "Playing": GamePhases.PLAY,
      "Drawing": GamePhases.DRAW,
      "Initializing": GamePhases.INIT,
      "Tie Round": GamePhases.TIE,
      "Locking": GamePhases.LOCK,
    };

    game.phase = legacyPhaseMap[data.phase] || data.phase;
    game.currentPlayerNumber = data.currentPlayerNumber;

    if (data.player1) {
      game.player1 = Player.fromData(data.player1);
    }

    if (data.player2) {
      game.player2 = Player.fromData(data.player2);
    }

    return game;
  }

  // ---- Turn / Phase Management ----------------------------------

  changeCurrentPlayer() {
    this.currentPlayerNumber = this.currentPlayerNumber === 1 ? 2 : 1;
  }

  changePhase(newPhase) {
    this.phase = newPhase;
  }

  // ---- Player Accessors -----------------------------------------

  getCurrentPlayer() {
    return this.currentPlayerNumber === 1 ? this.player1 : this.player2;
  }

  getPlayerFromSocketId(socketId) {
    if (this.player1.socketId === socketId) return this.player1;
    if (this.player2.socketId === socketId) return this.player2;

    throw new Error(`No player with the socket id: ${socketId} found!`);
  }

  getOpponentFromSocketId(socketId) {
    if (this.player1.socketId === socketId) return this.player2;
    if (this.player2.socketId === socketId) return this.player1;

    throw new Error(`No opponent found!`);
  }

  isPlayerTurn(socketId) {
    return this.getCurrentPlayer().socketId === socketId;
  }

  setPlayer(playerNumber, socketId, userName) {
    if (playerNumber === 1) {
      this.player1 = new Player(1, socketId, userName);
      return;
    }
    this.player2 = new Player(2, socketId, userName);
  }

  // ---- Game Logic -----------------------------------------------

  /**
   * Draws a card for the current player.
   * Returns the drawn card so it can be broadcast.
   */
  drawCard() {
    const currentPlayer = this.getCurrentPlayer();
    const randomNumber = Math.floor(Math.random() * 10) + 1;
    const newCard = { number: randomNumber, type: "green" };
    currentPlayer.score += newCard.number;
    this.evaluatePlayerState();
    return newCard;
  }

  /**
   * Plays a card from the current player hand.
   * Removes the card from hand, applies score modifier, evaluates state.
   * Returns the played card so it can be broadcast.
   */
  playCard(cardId) {
    const currentPlayer = this.getCurrentPlayer();

    const playedCard = currentPlayer.hand.find((card) => card.id === cardId);
    currentPlayer.hand = currentPlayer.hand.filter((card) => card.id !== cardId);

    const modifier = playedCard.type === "blue" ? 1 : -1;
    currentPlayer.score = Math.max(0, currentPlayer.score + playedCard.number * modifier);

    this.evaluatePlayerState();
    return playedCard;
  }

  /**
   * Evaluates and resolves a lock situation.
   * Returns "ROUND_WON", "TIE_ROUND", or null if not yet both locked.
   */
  evaluateLock() {
    if (
      this.player1.state === PlayerState.LOCK &&
      this.player2.state === PlayerState.LOCK
    ) {
      if (this.player1.score === this.player2.score) {
        return "TIE_ROUND";
      }

      if (this.player1.score > this.player2.score) {
        this.player2.state = PlayerState.LOSS;
        return "ROUND_WON";
      }

      this.player1.state = PlayerState.LOSS;
      return "ROUND_WON";
    }

    return null;
  }

  /**
   * Awards a point to the player who is NOT in a LOSS state.
   * Returns the winner.
   */
  awardPoint() {
    try {
      let winner = null;

      if (this.player1.state === PlayerState.LOSS) winner = this.player2;
      if (this.player2.state === PlayerState.LOSS) winner = this.player1;

      if (!winner) {
        throw new Error("No winner found, double check player states!");
      }

      winner.points++;
      return winner;
    } catch (error) {
      console.log(error.message);
    }
  }

  /** Resets both players scores and states for a new round. */
  resetRound() {
    this.player1.score = 0;
    this.player1.state = PlayerState.LIVE;

    this.player2.score = 0;
    this.player2.state = PlayerState.LIVE;
  }

  // ---- Internal -------------------------------------------------

  evaluatePlayerState() {
    const currentPlayer = this.getCurrentPlayer();

    if (currentPlayer.score > 20) currentPlayer.state = PlayerState.LOSS;
    if (currentPlayer.score === 20) currentPlayer.state = PlayerState.LOCK;
    if (currentPlayer.score < 20) currentPlayer.state = PlayerState.LIVE;
  }
}
