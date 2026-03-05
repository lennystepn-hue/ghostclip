import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../index";

describe("Health Check", () => {
  it("GET /health returns status ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.timestamp).toBeDefined();
  });
});
