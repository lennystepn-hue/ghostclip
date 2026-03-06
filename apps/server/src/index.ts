import "dotenv/config";
import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import { createServer } from "node:http";
import { Server } from "socket.io";

const app: Express = express();
app.set("trust proxy", 1);
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: true,
    credentials: true,
  },
});

app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

import { authRouter } from "./modules/auth/router";
import { clipboardRouter } from "./modules/clipboard/router";
import { setupSyncHandlers } from "./modules/sync/handler";
import { aiRouter } from "./modules/ai/router";
import { collectionsRouter } from "./modules/collections/router";
import { templatesRouter } from "./modules/templates/router";

// Mount module routers
app.use("/api/auth", authRouter);
app.use("/api/clips", clipboardRouter);
app.use("/api/collections", collectionsRouter);
app.use("/api/templates", templatesRouter);

// WebSocket sync handlers
setupSyncHandlers(io);
app.use("/api/ai", aiRouter);

const PORT = process.env.PORT || 4000;

async function start() {
  httpServer.listen(PORT, () => {
    console.log(`GhostClip server running on port ${PORT}`);
  });
}

if (process.env.NODE_ENV !== "test") {
  start().catch(console.error);
}

export { app, httpServer, io };
