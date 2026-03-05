import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  clipCreateSchema,
  collectionCreateSchema,
  replyTemplateSchema,
} from "../validators";

describe("registerSchema", () => {
  it("accepts valid registration data", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "securepass123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = registerSchema.safeParse({
      email: "not-an-email",
      password: "securepass123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password over 128 characters", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "a".repeat(129),
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts valid login data", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "anypassword",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
    });
    expect(result.success).toBe(false);
  });
});

describe("clipCreateSchema", () => {
  const validClip = {
    type: "text" as const,
    contentEnc: "encrypted-content",
    previewEnc: null,
    contentHash: "abc123",
    sourceApp: null,
    tags: ["test"],
    summary: null,
    mood: null,
    actions: [],
    sensitivity: null,
    autoExpire: null,
    aiRaw: null,
  };

  it("accepts valid clip data", () => {
    const result = clipCreateSchema.safeParse(validClip);
    expect(result.success).toBe(true);
  });

  it("accepts clip with actions", () => {
    const result = clipCreateSchema.safeParse({
      ...validClip,
      actions: [
        {
          label: "Open link",
          type: "link",
          payload: { url: "https://example.com" },
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid clip type", () => {
    const result = clipCreateSchema.safeParse({
      ...validClip,
      type: "video",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid datetime for autoExpire", () => {
    const result = clipCreateSchema.safeParse({
      ...validClip,
      autoExpire: "2025-12-31T23:59:59Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid datetime for autoExpire", () => {
    const result = clipCreateSchema.safeParse({
      ...validClip,
      autoExpire: "not-a-date",
    });
    expect(result.success).toBe(false);
  });
});

describe("collectionCreateSchema", () => {
  it("accepts valid collection data", () => {
    const result = collectionCreateSchema.safeParse({
      name: "My Collection",
      icon: "📋",
      smartRule: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = collectionCreateSchema.safeParse({
      name: "",
      icon: "📋",
      smartRule: null,
    });
    expect(result.success).toBe(false);
  });

  it("rejects name over 100 characters", () => {
    const result = collectionCreateSchema.safeParse({
      name: "a".repeat(101),
      icon: "📋",
      smartRule: null,
    });
    expect(result.success).toBe(false);
  });
});

describe("replyTemplateSchema", () => {
  it("accepts valid template data", () => {
    const result = replyTemplateSchema.safeParse({
      name: "Greeting",
      template: "Hello {{name}}, nice to meet you!",
      context: { tone: "friendly" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty template", () => {
    const result = replyTemplateSchema.safeParse({
      name: "Greeting",
      template: "",
      context: {},
    });
    expect(result.success).toBe(false);
  });
});
