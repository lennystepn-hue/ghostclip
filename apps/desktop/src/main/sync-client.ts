import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function connectSync(
  serverUrl: string,
  token: string,
  handlers: {
    onClipNew: (data: unknown) => void;
    onClipUpdate: (data: unknown) => void;
    onClipDelete: (data: unknown) => void;
    onError: (error: string) => void;
  },
): Socket {
  if (socket?.connected) {
    socket.disconnect();
  }

  socket = io(serverUrl, {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
  });

  socket.on("connect", () => {
    console.log("Sync connected");
  });

  socket.on("clip:new", handlers.onClipNew);
  socket.on("clip:update", handlers.onClipUpdate);
  socket.on("clip:delete", handlers.onClipDelete);
  socket.on("sync:error", (data: { message: string }) => handlers.onError(data.message));

  socket.on("disconnect", (reason) => {
    console.log("Sync disconnected:", reason);
  });

  return socket;
}

export function emitClipNew(data: unknown) {
  socket?.emit("clip:new", data);
}

export function emitClipUpdate(data: unknown) {
  socket?.emit("clip:update", data);
}

export function emitClipDelete(clipId: string) {
  socket?.emit("clip:delete", { clipId });
}

export function flushOfflineQueue(items: unknown[]) {
  socket?.emit("sync:queue", { items });
}

export function sendHeartbeat() {
  socket?.emit("device:heartbeat");
}

export function disconnectSync() {
  socket?.disconnect();
  socket = null;
}
