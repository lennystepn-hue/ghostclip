import { io, Socket } from "socket.io-client";
import { insertClip, updateClip, deleteClipById, getAllClips } from "./db";
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
    const content = isEncryptionReady() && data.encryptedContent
      ? decryptContent(data.encryptedContent) || data.preview || ""
      : data.content || data.preview || "";

    const clip = { ...data, content };

    // Conflict resolution: check if clip with same hash already exists locally
    const existing = getAllClips(9999).find(c => c.contentHash === clip.contentHash);
    if (existing) {
      // Same content — merge metadata (keep newer enrichment)
      const existingTime = new Date(existing.createdAt).getTime();
      const incomingTime = new Date(clip.createdAt).getTime();

      if (clip.enriched && !existing.enriched) {
        // Incoming has AI data, ours doesn't — take theirs
        updateClip({ ...existing, tags: clip.tags, summary: clip.summary, mood: clip.mood, actions: clip.actions, sensitivity: clip.sensitivity, enriched: true });
      } else if (incomingTime > existingTime && clip.enriched) {
        // Incoming is newer and enriched — update our metadata
        updateClip({ ...existing, tags: clip.tags, summary: clip.summary, mood: clip.mood, actions: clip.actions, sensitivity: clip.sensitivity });
      }
      // Otherwise keep our local version (ours is newer or both have same data)
      console.log("Sync: duplicate clip merged by hash");
      return;
    }

    insertClip(clip);
  });

  socket.on("clip:update", (data: any) => {
    console.log("Sync: received clip update");
    // Timestamp-based conflict: only apply if incoming is newer
    const existing = getAllClips(9999).find(c => c.id === data.id);
    if (existing) {
      const localTime = new Date(existing.createdAt).getTime();
      const remoteTime = new Date(data.createdAt || 0).getTime();
      // Accept update if remote is enriched and local isn't, or remote is newer
      if ((data.enriched && !existing.enriched) || remoteTime >= localTime) {
        updateClip(data);
      }
    } else {
      updateClip(data);
    }
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
      socket.emit("device:heartbeat", {
        timestamp: Date.now(),
        clipCount: getAllClips(99999).length,
        platform: process.platform,
        hostname: require("os").hostname(),
      });
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
