// ============================================================ \\
// services/socket.js
// Infrastructure service — creates and exports the single
// Socket.IO client instance used throughout the app.
// Centralising this here means the rest of the app never needs
// to know about the URL or connection config.
// ============================================================ \\
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

export const socket = io(SOCKET_URL, { autoConnect: true });
