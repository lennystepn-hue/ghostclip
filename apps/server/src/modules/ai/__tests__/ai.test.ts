import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

vi.mock("../../../database/connection", () => ({
  pool: { connect: vi.fn(), query: vi.fn().mockResolvedValue({ rows: [] }) },
  redis: { get: vi.fn(), set: vi.fn(), del: vi.fn() },
}));

vi.mock("@ghostclip/ai-client", () => ({
  enrichClip: vi.fn().mockResolvedValue({
    tags: ["test"],
    summary: "Test",
    mood: "neutral",
    actions: [],
    relatedTo: [],
    sensitivity: "low",
    autoExpire: null,
  }),
  generateReplies: vi.fn().mockResolvedValue([
    { id: "1", text: "Reply", tone: "casual", confidence: 0.9 },
  ]),
  chat: vi.fn().mockResolvedValue("AI response"),
  analyzeImage: vi.fn().mockResolvedValue({
    ocrText: "text",
    description: "desc",
    tags: [],
    summary: "img",
    mood: "neutral",
    actions: [],
    relatedTo: [],
    sensitivity: "low",
    autoExpire: null,
  }),
}));

vi.mock("../embedding", () => ({
  generateEmbedding: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
}));

import { app } from "../../../index";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const token = jwt.sign({ userId: "user1", deviceId: "dev1" }, JWT_SECRET, { expiresIn: "15m" });

describe("AI API", () => {
  it("POST /api/ai/enrich returns enrichment", async () => {
    const res = await request(app)
      .post("/api/ai/enrich")
      .set("Authorization", `Bearer ${token}`)
      .send({ type: "text", content: "test content" });
    expect(res.status).toBe(200);
    expect(res.body.tags).toBeDefined();
    expect(res.body.embedding).toBeDefined();
  });

  it("POST /api/ai/enrich returns 400 without content", async () => {
    const res = await request(app)
      .post("/api/ai/enrich")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it("POST /api/ai/replies returns suggestions", async () => {
    const res = await request(app)
      .post("/api/ai/replies")
      .set("Authorization", `Bearer ${token}`)
      .send({ message: "Hallo Max" });
    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
  });

  it("POST /api/ai/chat returns response", async () => {
    const res = await request(app)
      .post("/api/ai/chat")
      .set("Authorization", `Bearer ${token}`)
      .send({ message: "Was hab ich kopiert?" });
    expect(res.status).toBe(200);
    expect(res.body.response).toBeDefined();
  });

  it("POST /api/ai/vision returns 400 without image", async () => {
    const res = await request(app)
      .post("/api/ai/vision")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it("returns 401 without auth", async () => {
    const res = await request(app).post("/api/ai/enrich").send({ type: "text", content: "test" });
    expect(res.status).toBe(401);
  });
});
