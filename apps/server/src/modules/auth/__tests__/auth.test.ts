import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

// Mock the database pool before importing app
vi.mock("../../../database/connection", () => ({
  pool: {
    connect: vi.fn(),
    query: vi.fn(),
  },
  redis: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
}));

import { app } from "../../../index";

describe("Auth API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/auth/register", () => {
    it("returns 400 for invalid email", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: "not-an-email", password: "password123" });
      expect(res.status).toBe(400);
    });

    it("returns 400 for short password", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: "test@test.com", password: "short" });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/auth/login", () => {
    it("returns 400 for invalid email", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "not-an-email", password: "password123" });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/auth/refresh", () => {
    it("returns 400 when no refresh token provided", async () => {
      const res = await request(app)
        .post("/api/auth/refresh")
        .send({});
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("returns 401 without auth token", async () => {
      const res = await request(app)
        .post("/api/auth/logout");
      expect(res.status).toBe(401);
    });
  });
});
