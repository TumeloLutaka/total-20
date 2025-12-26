import { SocketEvents } from "./shared/socketEvents.js";

const socket = io();

const idHeader = document.getElementById("socket_id");
const form = document.getElementById("form");
const input = document.getElementById("input");

form.addEventListener("submit", function (e) {
  e.preventDefault();
  if (input.value) {
    socket.emit(SocketEvents.C2S.JOIN_ROOM, input.value);
    input.value = "";
  }
});

sessionStorage.setItem("username", Math.random());

socket.on(SocketEvents.S2C.GIVE_ID, () => {
  idHeader.textContent = socket.id;
});

socket.on(SocketEvents.S2C.PRIVATE_MESSAGE, (msg) => {
  console.log(msg);
});

socket.on(SocketEvents.S2C.GAME_START, (roomId) => {
  // This programmatically changes the URL and loads the new page
  console.log("Loading game room: " + roomId);
  window.location.href = `/game/${roomId}`;
});
