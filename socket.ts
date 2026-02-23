"use client";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const initSocket = (): Socket => {
  // Return existing live socket
  if (socket?.connected) return socket;

  // Disconnect stale socket before recreating
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  const serverUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

  socket = io(serverUrl, {
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 20000,

    transports: ["websocket"],
    forceNew: false,
  });

  return socket;
};

export const resetSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
