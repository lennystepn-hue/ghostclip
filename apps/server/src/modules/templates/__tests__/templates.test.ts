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

describe("Templates API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /api/templates returns 401 without auth", async () => {
    const res = await request(app).get("/api/templates");
    expect(res.status).toBe(401);
  });

  it("POST /api/templates returns 401 without auth", async () => {
    const res = await request(app).post("/api/templates").send({ name: "Test" });
    expect(res.status).toBe(401);
  });

  it("POST /api/templates creates template with valid data", async () => {
    const mockRow = {
      id: "tpl-1",
      user_id: "test-user-id",
      name: "Greeting",
      template: "Hello {{name}}, thanks for reaching out!",
      context: { tone: "friendly" },
      usage_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    (pool.query as any).mockResolvedValueOnce({ rows: [mockRow] });

    const res = await request(app)
      .post("/api/templates")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        name: "Greeting",
        template: "Hello {{name}}, thanks for reaching out!",
        context: { tone: "friendly" },
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Greeting");
    expect(res.body.template).toContain("Hello");
    expect(res.body.usageCount).toBe(0);
  });

  it("POST /api/templates returns 400 for invalid input", async () => {
    const res = await request(app)
      .post("/api/templates")
      .set("Authorization", `Bearer ${testToken}`)
      .send({ name: "" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid input");
  });

  it("GET /api/templates returns array when authenticated", async () => {
    (pool.query as any).mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get("/api/templates")
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("DELETE /api/templates/:id returns 204 on success", async () => {
    (pool.query as any).mockResolvedValueOnce({ rows: [{ id: "tpl-1" }] });

    const res = await request(app)
      .delete("/api/templates/tpl-1")
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(204);
  });

  it("DELETE /api/templates/:id returns 404 when not found", async () => {
    (pool.query as any).mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .delete("/api/templates/nonexistent")
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(404);
  });
});
