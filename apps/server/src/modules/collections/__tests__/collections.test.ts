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

describe("Collections API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /api/collections returns 401 without auth", async () => {
    const res = await request(app).get("/api/collections");
    expect(res.status).toBe(401);
  });

  it("POST /api/collections returns 401 without auth", async () => {
    const res = await request(app).post("/api/collections").send({ name: "Test" });
    expect(res.status).toBe(401);
  });

  it("POST /api/collections creates collection with valid data", async () => {
    const mockRow = {
      id: "col-1",
      user_id: "test-user-id",
      name: "Work",
      icon: "briefcase",
      smart_rule: null,
      clip_ids: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    (pool.query as any).mockResolvedValueOnce({ rows: [mockRow] });

    const res = await request(app)
      .post("/api/collections")
      .set("Authorization", `Bearer ${testToken}`)
      .send({ name: "Work", icon: "briefcase", smartRule: null });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Work");
    expect(res.body.icon).toBe("briefcase");
  });

  it("POST /api/collections returns 400 for invalid input", async () => {
    const res = await request(app)
      .post("/api/collections")
      .set("Authorization", `Bearer ${testToken}`)
      .send({ name: "" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid input");
  });

  it("GET /api/collections returns array when authenticated", async () => {
    (pool.query as any).mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get("/api/collections")
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("DELETE /api/collections/:id returns 204 on success", async () => {
    (pool.query as any).mockResolvedValueOnce({ rows: [{ id: "col-1" }] });

    const res = await request(app)
      .delete("/api/collections/col-1")
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(204);
  });

  it("DELETE /api/collections/:id returns 404 when not found", async () => {
    (pool.query as any).mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .delete("/api/collections/nonexistent")
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(404);
  });
});
