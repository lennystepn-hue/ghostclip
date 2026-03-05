import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

vi.mock("../../../database/connection", () => ({
  pool: {
    connect: vi.fn(),
    query: vi.fn(),
  },
  redis: { get: vi.fn(), set: vi.fn(), del: vi.fn() },
}));

import { app } from "../../../index";
import { pool } from "../../../database/connection";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const testToken = jwt.sign({ userId: "test-user-id", deviceId: "test-device-id" }, JWT_SECRET, { expiresIn: "15m" });

describe("Clipboard API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /api/clips returns 401 without auth", async () => {
    const res = await request(app).get("/api/clips");
    expect(res.status).toBe(401);
  });

  it("GET /api/clips returns clips when authenticated", async () => {
    (pool.query as any).mockResolvedValueOnce({
      rows: [],
    }).mockResolvedValueOnce({
      rows: [{ count: "0" }],
    });

    const res = await request(app)
      .get("/api/clips")
      .set("Authorization", `Bearer ${testToken}`);
    expect(res.status).toBe(200);
    expect(res.body.clips).toEqual([]);
    expect(res.body.total).toBe(0);
  });

  it("POST /api/clips returns 400 for invalid input", async () => {
    // Mock dedup check returning no duplicate
    (pool.query as any).mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post("/api/clips")
      .set("Authorization", `Bearer ${testToken}`)
      .send({ type: "invalid" });
    expect(res.status).toBe(400);
  });

  it("DELETE /api/clips/:id returns 401 without auth", async () => {
    const res = await request(app).delete("/api/clips/some-id");
    expect(res.status).toBe(401);
  });

  it("GET /api/clips/stats returns 401 without auth", async () => {
    const res = await request(app).get("/api/clips/stats");
    expect(res.status).toBe(401);
  });

  it("POST /api/clips/search returns 400 without embedding", async () => {
    const res = await request(app)
      .post("/api/clips/search")
      .set("Authorization", `Bearer ${testToken}`)
      .send({});
    expect(res.status).toBe(400);
  });
});
