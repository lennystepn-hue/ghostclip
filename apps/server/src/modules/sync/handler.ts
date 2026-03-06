import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { pool } from "../../database/connection";

if (!process.env.JWT_SECRET) {
  throw new Error("FATAL: JWT_SECRET environment variable is required.");
}
const JWT_SECRET = process.env.JWT_SECRET;

interface AuthenticatedSocket extends Socket {
  userId?: string;
  deviceId?: string;
}

export function setupSyncHandlers(io: Server) {
  // Auth middleware for WebSocket
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication required"));

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; deviceId: string };
      socket.userId = decoded.userId;
      socket.deviceId = decoded.deviceId;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    const deviceId = socket.deviceId!;

    // Join user room (all devices of same user)
    socket.join(`user:${userId}`);
    console.log(`Device ${deviceId} connected for user ${userId}`);

    // Update device last_sync
    pool.query("UPDATE devices SET last_sync = NOW() WHERE id = $1", [deviceId]).catch(console.error);

    // New clip from device -> broadcast to other devices
    socket.on("clip:new", async (data) => {
      try {
        // Broadcast to all OTHER devices of this user
        socket.to(`user:${userId}`).emit("clip:new", {
          ...data,
          deviceId,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Sync clip:new error:", error);
        socket.emit("sync:error", { message: "Failed to sync new clip" });
      }
    });

    // Clip update (pin, archive, tags)
    socket.on("clip:update", async (data) => {
      try {
        socket.to(`user:${userId}`).emit("clip:update", {
          ...data,
          deviceId,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Sync clip:update error:", error);
        socket.emit("sync:error", { message: "Failed to sync clip update" });
      }
    });

    // Clip delete
    socket.on("clip:delete", async (data) => {
      try {
        socket.to(`user:${userId}`).emit("clip:delete", {
          clipId: data.clipId,
          deviceId,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Sync clip:delete error:", error);
        socket.emit("sync:error", { message: "Failed to sync clip delete" });
      }
    });

    // Offline queue flush - client sends batch of clips accumulated while offline
    socket.on("sync:queue", async (data) => {
      try {
        const { items } = data; // array of { type, payload, timestamp }

        // Process in order (FIFO)
        for (const item of items) {
          socket.to(`user:${userId}`).emit(item.type, {
            ...item.payload,
            deviceId,
            timestamp: item.timestamp,
          });
        }

        socket.emit("sync:queue:ack", { processed: items.length });
      } catch (error) {
        console.error("Sync queue error:", error);
        socket.emit("sync:error", { message: "Failed to process sync queue" });
      }
    });

    // Heartbeat - update last_sync
    socket.on("device:heartbeat", async () => {
      try {
        await pool.query("UPDATE devices SET last_sync = NOW() WHERE id = $1", [deviceId]);
        socket.emit("device:heartbeat:ack", { timestamp: new Date().toISOString() });
      } catch (error) {
        console.error("Heartbeat error:", error);
      }
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log(`Device ${deviceId} disconnected for user ${userId}`);
      pool.query("UPDATE devices SET last_sync = NOW() WHERE id = $1", [deviceId]).catch(console.error);
    });
  });
}
