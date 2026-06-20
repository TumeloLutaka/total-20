import { GamePhases, PlayerState } from "../../Shared/enums.js";

export default class Game {
  constructor(config) {
    this.currentPlayer = null;
    this.phase = GamePhases.NEXT;
    this.player1 = null;
    this.player2 = null;
  }

  awardPoint() {
    try {
      let winner = null;

      // Award point to the player.
      if (this.player1.state == PlayerState.LOSS) winner = this.player2;
      if (this.player2.state == PlayerState.LOSS) winner = this.player1;

      if (!winner)
        throw new Error("No winner found, double check player states!");

      winner.points++;
      return winner;
    } catch (error) {
      console.log(error.message);
    }
  }

  changeCurrentPlayer() {
    const isPlayer1CurrPlayer = this.currentPlayer === this.player1;

    if (isPlayer1CurrPlayer) {
      this.currentPlayer = this.player2;
      return;
    }

    this.currentPlayer = this.player1;
    return;
  }

  changePhase(newPhase) {
    this.phase = newPhase;
  }

  drawCard() {
    const randomNumber = Math.floor(Math.random() * 10) + 1;
    const newCard = { number: randomNumber, type: "green" };
    this.currentPlayer.score += newCard.number;

    this.evaluatePlayerState();
    return newCard;
  }

  evaluateLock() {
    // Check if both have locked
    if (
      this.player1.state === PlayerState.LOCK &&
      this.player2.state === PlayerState.LOCK
    ) {
      // Check who has the higher score.
      if (this.player1.score === this.player2.score) {
        // No one get's points
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

  evaluatePlayerState() {
    if (this.currentPlayer.score > 20)
      this.currentPlayer.state = PlayerState.LOSS;

    if (this.currentPlayer.score == 20)
      this.currentPlayer.state = PlayerState.LOCK;

    if (this.currentPlayer.score < 20)
      this.currentPlayer.state = PlayerState.LIVE;
  }

  getCurrentPlayer() {
    return this.currentPlayer;
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
    // Get player associated with Socket:
    if (this.currentPlayer.socketId === socketId) return true;

    return false;
  }

  playCard(cardId) {
    // Find the played card
    const playedCard = this.currentPlayer.hand.find(
      (card) => card.id === cardId,
    );

    this.currentPlayer.hand = this.currentPlayer.hand.filter(
      (card) => card.id !== cardId,
    );

    const modifier = playedCard.type === "blue" ? 1 : -1;
    this.currentPlayer.score += playedCard.number * modifier;

    this.evaluatePlayerState();
    return playedCard;
  }

  resetRound() {
    this.player1.score = 0;
    this.player1.state = PlayerState.LIVE;

    this.player2.score = 0;
    this.player2.state = PlayerState.LIVE;
  }

  setPlayer(playerNumber, socketId, userName) {
    if (playerNumber === 1) {
      this.player1 = new Player(1, socketId, userName);
      this.currentPlayer = this.player1;
      return;
    }

    this.player2 = new Player(2, socketId, userName);
  }
}

class Player {
  constructor(playerNumber, socketId, userName) {
    this.hand = this.generateHand();
    this.userName = userName;
    this.pileTopCard = null;
    this.playerNumber = playerNumber;
    this.currentPlayerNumber = 1;
    this.points = 0;
    this.score = 0;
    this.socketId = socketId;
    this.state = PlayerState.LIVE;
  }

  generateHand() {
    const cards = [];

    for (let i = 0; i < 5; i++) {
      const randomNum = Math.floor(Math.random() * 10) + 1;
      const randomCol =
        Math.floor(Math.random() * 2) + 1 === 1 ? "blue" : "red";
      cards.push({
        id: crypto.randomUUID(),
        number: randomNum,
        type: randomCol,
      });
    }

    return cards;
  }

  getHandIds() {
    const handIds = [];

    this.hand.forEach((card) => {
      handIds.push(card.id);
    });

    return handIds;
  }
}
