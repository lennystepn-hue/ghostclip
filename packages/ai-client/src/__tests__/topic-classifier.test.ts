import { describe, it, expect, vi, beforeEach } from "vitest";
import { classifyClipTopic } from "../topic-classifier";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe("classifyClipTopic", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("returns null when no API credentials provided", async () => {
    const result = await classifyClipTopic({
      content: "test content",
      tags: [],
      summary: "test",
      type: "text",
      existingTopics: [],
    });
    expect(result).toBeNull();
  });

  it("returns topic classification result on success", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              topicName: "React Development",
              topicDescription: "React code snippets and components",
              topicIcon: "⚛️",
              confidence: 0.92,
              isNew: true,
            }),
          },
        ],
      }),
    });

    const result = await classifyClipTopic({
      content: "import React from 'react';\nfunction App() { return <div>Hello</div>; }",
      tags: ["code", "react", "javascript"],
      summary: "React component code",
      type: "text",
      existingTopics: [],
      apiKey: "test-key",
    });

    expect(result).not.toBeNull();
    expect(result!.topicName).toBe("React Development");
    expect(result!.confidence).toBe(0.92);
    expect(result!.topicIcon).toBe("⚛️");
    expect(result!.isNew).toBe(true);
  });

  it("uses existing topic name when appropriate", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              topicName: "React Development",
              topicDescription: "Existing React topic",
              topicIcon: "⚛️",
              confidence: 0.88,
              isNew: false,
            }),
          },
        ],
      }),
    });

    const result = await classifyClipTopic({
      content: "const [state, setState] = useState(0);",
      tags: ["react", "hooks"],
      summary: "React useState hook usage",
      type: "text",
      existingTopics: ["React Development", "Meeting Notes"],
      apiKey: "test-key",
    });

    expect(result).not.toBeNull();
    expect(result!.topicName).toBe("React Development");
    expect(result!.isNew).toBe(false);
  });

  it("handles API errors gracefully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => "Internal Server Error",
    });

    await expect(
      classifyClipTopic({
        content: "test",
        tags: [],
        summary: "",
        type: "text",
        existingTopics: [],
        apiKey: "test-key",
      })
    ).rejects.toThrow("Topic classification 500");
  });

  it("returns null for malformed JSON response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ type: "text", text: "not valid json" }],
      }),
    });

    const result = await classifyClipTopic({
      content: "test",
      tags: [],
      summary: "",
      type: "text",
      existingTopics: [],
      apiKey: "test-key",
    });

    expect(result).toBeNull();
  });

  it("returns null when response is missing required fields", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [
          {
            type: "text",
            text: JSON.stringify({ topicDescription: "missing name and confidence" }),
          },
        ],
      }),
    });

    const result = await classifyClipTopic({
      content: "test",
      tags: [],
      summary: "",
      type: "text",
      existingTopics: [],
      apiKey: "test-key",
    });

    expect(result).toBeNull();
  });

  it("sends correct headers with OAuth token", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              topicName: "Test",
              topicDescription: "Test topic",
              topicIcon: "📂",
              confidence: 0.8,
              isNew: true,
            }),
          },
        ],
      }),
    });

    await classifyClipTopic({
      content: "test",
      tags: [],
      summary: "",
      type: "text",
      existingTopics: [],
      oauthToken: "oauth-test-token",
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers["Authorization"]).toBe("Bearer oauth-test-token");
    expect(options.headers["anthropic-beta"]).toBe("oauth-2025-04-20");
  });
});
