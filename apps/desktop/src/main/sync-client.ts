import { io, Socket } from "socket.io-client";
import { insertClip, updateClip, deleteClipById } from "./db";
import { encryptContent, decryptContent, isEncryptionReady } from "./encryption";

let socket: Socket | null = null;
let offlineQueue: any[] = [];

export function connectSync(token: string, serverUrl: string = "http://localhost:4000") {
  if (socket?.connected) return;

  socket = io(serverUrl, {
    auth: { token },
    reconnection: true,
    reconnectionDelay: 5000,
    reconnectionAttempts: 10,
  });

  socket.on("connect", () => {
    console.log("Sync connected to server");
    flushOfflineQueue();
  });

  socket.on("disconnect", (reason) => {
    console.log("Sync disconnected:", reason);
  });

  // Receive clips from other devices
  socket.on("clip:new", (data: any) => {
    console.log("Sync: received new clip from another device");
    const clip = {
      ...data,
      content: isEncryptionReady() && data.encryptedContent
        ? decryptContent(data.encryptedContent) || data.preview || ""
        : data.content || data.preview || "",
    };
    insertClip(clip);
  });

  socket.on("clip:update", (data: any) => {
    console.log("Sync: received clip update");
    updateClip(data);
  });

  socket.on("clip:delete", (data: { id: string }) => {
    console.log("Sync: received clip deletion");
    deleteClipById(data.id);
  });

  socket.on("connect_error", (err) => {
    console.error("Sync connection error:", err.message);
  });

  // Heartbeat every 30 seconds
  setInterval(() => {
    if (socket?.connected) {
      socket.emit("device:heartbeat", { timestamp: Date.now() });
    }
  }, 30_000);
}

export function emitClipNew(clip: any) {
  const payload = {
    ...clip,
    encryptedContent: isEncryptionReady() ? encryptContent(clip.content) : null,
    content: isEncryptionReady() ? undefined : clip.content,
  };

  if (socket?.connected) {
    socket.emit("clip:new", payload);
  } else {
    offlineQueue.push({ event: "clip:new", data: payload });
  }
}

export function emitClipUpdate(clip: any) {
  if (socket?.connected) {
    socket.emit("clip:update", clip);
  } else {
    offlineQueue.push({ event: "clip:update", data: clip });
  }
}

export function emitClipDelete(id: string) {
  if (socket?.connected) {
    socket.emit("clip:delete", { id });
  } else {
    offlineQueue.push({ event: "clip:delete", data: { id } });
  }
}

function flushOfflineQueue() {
  if (!socket?.connected || offlineQueue.length === 0) return;
  console.log(`Sync: flushing ${offlineQueue.length} offline operations`);

  for (const item of offlineQueue) {
    socket.emit(item.event, item.data);
  }
  offlineQueue = [];
}

export function disconnectSync() {
  socket?.disconnect();
  socket = null;
}

export function isSyncConnected(): boolean {
  return socket?.connected ?? false;
}
