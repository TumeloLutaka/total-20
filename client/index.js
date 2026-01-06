import { SocketEvents } from "./shared/socketEvents.js";

const socket = io();

const userId = document.getElementById("user-id");
const form = document.getElementById("form");
const input = document.getElementById("input");
const users = document.querySelector("#users")

form.addEventListener("submit", function (e) {
  e.preventDefault();
  if (input.value) {
    socket.emit(SocketEvents.C2S.JOIN_ROOM, input.value);
    input.value = "";
  }
});

socket.on(SocketEvents.S2C.USER_CONNECTED, userList => {
  //Clear user list
  users.innerHTML = ""

  // Loop through user list and adds to users
  userList.forEach(user => {
    const listElement = document.createElement("li")
    listElement.classList.add("user-list-item")
    listElement.innerHTML = `
    <p>${user}</p>
    `
    users.appendChild(listElement)
  });
})

socket.on(SocketEvents.S2C.GIVE_ID, (id) => {
  userId.textContent = id;
});

socket.on(SocketEvents.S2C.PRIVATE_MESSAGE, (msg) => {
  console.log(msg);
});

socket.on(SocketEvents.S2C.GAME_START, (roomId) => {
  // This programmatically changes the URL and loads the new page
  console.log("Loading game room: " + roomId);
  window.location.href = `/game/${roomId}`;
});
