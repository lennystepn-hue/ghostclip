import "dotenv/config";
import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import { createServer } from "node:http";
import { Server } from "socket.io";

const app: Express = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.APP_URL || "http://localhost:3000",
    credentials: true,
  },
});

app.use(helmet());
app.use(
  cors({
    origin: process.env.APP_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// TODO: Mount module routers
// app.use("/api/auth", authRouter);
// app.use("/api/clips", clipsRouter);
// app.use("/api/collections", collectionsRouter);
// app.use("/api/templates", templatesRouter);
// app.use("/api/ai", aiRouter);

const PORT = process.env.PORT || 4000;

async function start() {
  httpServer.listen(PORT, () => {
    console.log(`GhostClip server running on port ${PORT}`);
  });
}

start().catch(console.error);

export { app, httpServer, io };
