// Import socket events object
import { SocketEvents } from "../shared/socketEvents.js";

let socket;
const roomId = window.location.pathname.split("/").pop();

export function initializeSocketHandler(handleActionStream) {
  socket = io();

  // ========== SOCKET.IO EVENTS LISTENER ========== \\
  socket.on("connect", () => {
    // Let server know we are connected and want the gameState data
    socket.emit(SocketEvents.C2S.GET_GAME, {
      roomId,
    });
  });

  socket.on(SocketEvents.S2C.SEND_GAME_STATE, (_GameState) => {
    const gameState = _GameState;

    handleActionStream(gameState); 
  });

  // Call server let it know player has loaded into the game and get initial game state.
}

export function sendIntent(overrides) {
  const actionStreamData = {
    roomId,
    ...overrides,
  };

  socket.emit(SocketEvents.C2S.ACTION_STREAM, actionStreamData);
}
