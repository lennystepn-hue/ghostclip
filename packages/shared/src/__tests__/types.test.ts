import { describe, it, expect } from "vitest";
import type { FileMetadata, Topic, ClipTopic } from "../types";

describe("FileMetadata type", () => {
  it("accepts valid file metadata", () => {
    const meta: FileMetadata = {
      filename: "test.txt",
      extension: ".txt",
      size: 1024,
      path: "/home/user/test.txt",
      mimeType: "text/plain",
    };
    expect(meta.filename).toBe("test.txt");
    expect(meta.extension).toBe(".txt");
    expect(meta.size).toBe(1024);
    expect(meta.path).toBe("/home/user/test.txt");
    expect(meta.mimeType).toBe("text/plain");
  });

  it("supports code file metadata", () => {
    const meta: FileMetadata = {
      filename: "app.tsx",
      extension: ".tsx",
      size: 4096,
      path: "/project/src/app.tsx",
      mimeType: "text/tsx",
    };
    expect(meta.filename).toBe("app.tsx");
    expect(meta.extension).toBe(".tsx");
  });

  it("supports image file metadata", () => {
    const meta: FileMetadata = {
      filename: "screenshot.png",
      extension: ".png",
      size: 204800,
      path: "/home/user/Pictures/screenshot.png",
      mimeType: "image/png",
    };
    expect(meta.mimeType).toBe("image/png");
  });
});

describe("Topic type", () => {
  it("accepts valid topic", () => {
    const topic: Topic = {
      id: "topic-1",
      name: "React Development",
      description: "React code snippets and components",
      icon: "⚛️",
      clipCount: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(topic.name).toBe("React Development");
    expect(topic.clipCount).toBe(5);
    expect(topic.icon).toBe("⚛️");
  });
});

describe("ClipTopic type", () => {
  it("accepts valid clip-topic assignment", () => {
    const ct: ClipTopic = {
      clipId: "clip-1",
      topicId: "topic-1",
      confidence: 0.85,
      assignedAt: new Date().toISOString(),
    };
    expect(ct.confidence).toBe(0.85);
    expect(ct.clipId).toBe("clip-1");
    expect(ct.topicId).toBe("topic-1");
  });

  it("confidence is between 0 and 1", () => {
    const ct: ClipTopic = {
      clipId: "clip-1",
      topicId: "topic-1",
      confidence: 0.92,
      assignedAt: new Date().toISOString(),
    };
    expect(ct.confidence).toBeGreaterThanOrEqual(0);
    expect(ct.confidence).toBeLessThanOrEqual(1);
  });
});
