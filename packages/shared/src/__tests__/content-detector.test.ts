import { describe, it, expect } from "vitest";
import { detectContentKind, getAutoActions } from "../content-detector";

describe("detectContentKind", () => {
  describe("url", () => {
    it("detects https URLs", () => {
      expect(detectContentKind("https://example.com/foo?bar=1").kind).toBe("url");
    });

    it("detects http URLs", () => {
      expect(detectContentKind("http://localhost:3000").kind).toBe("url");
    });
  });

  describe("color_hex", () => {
    it("detects 6-digit hex colors", () => {
      const result = detectContentKind("#ff5733");
      expect(result.kind).toBe("color_hex");
      expect(result.metadata.hex).toBe("#FF5733");
    });

    it("detects 3-digit hex colors", () => {
      expect(detectContentKind("#abc").kind).toBe("color_hex");
    });

    it("does not misdetect random strings as hex", () => {
      expect(detectContentKind("#gggggg").kind).not.toBe("color_hex");
    });
  });

  describe("json", () => {
    it("detects valid JSON objects", () => {
      expect(detectContentKind('{"key": "value", "num": 42}').kind).toBe("json");
    });

    it("detects valid JSON arrays", () => {
      expect(detectContentKind('[1, 2, 3]').kind).toBe("json");
    });

    it("does not detect invalid JSON", () => {
      expect(detectContentKind('{"key": broken}').kind).not.toBe("json");
    });
  });

  describe("xml", () => {
    it("detects XML content", () => {
      const xml = `<root>\n  <child>value</child>\n</root>`;
      expect(detectContentKind(xml).kind).toBe("xml");
    });
  });

  describe("cron_expression", () => {
    it("detects 5-field cron expressions", () => {
      expect(detectContentKind("0 */6 * * *").kind).toBe("cron_expression");
    });

    it("detects standard cron with named weekday equivalent", () => {
      expect(detectContentKind("30 2 * * 1-5").kind).toBe("cron_expression");
    });

    it("does not detect normal text as cron", () => {
      expect(detectContentKind("hello world").kind).not.toBe("cron_expression");
    });
  });

  describe("regex_pattern", () => {
    it("detects regex with flags", () => {
      expect(detectContentKind("/^foo\\d+$/gi").kind).toBe("regex_pattern");
    });

    it("detects basic regex", () => {
      expect(detectContentKind("/[a-z]+/").kind).toBe("regex_pattern");
    });

    it("does not detect plain text as regex", () => {
      expect(detectContentKind("some/path/to/file").kind).not.toBe("regex_pattern");
    });
  });

  describe("error_message", () => {
    it("detects TypeError", () => {
      const err = `TypeError: Cannot read property 'x' of undefined\n    at doSomething (app.js:10:5)`;
      expect(detectContentKind(err).kind).toBe("error_message");
    });

    it("detects Python traceback", () => {
      const err = `Traceback (most recent call last):\n  File "app.py", line 5, in <module>`;
      expect(detectContentKind(err).kind).toBe("error_message");
    });

    it("detects JS stack trace lines", () => {
      const err = `Error: something went wrong\n    at Object.<anonymous> (index.js:3:1)`;
      expect(detectContentKind(err).kind).toBe("error_message");
    });
  });

  describe("phone_number", () => {
    it("detects US phone numbers", () => {
      expect(detectContentKind("+1 (555) 123-4567").kind).toBe("phone_number");
    });

    it("detects international format", () => {
      expect(detectContentKind("+49 30 12345678").kind).toBe("phone_number");
    });

    it("does not detect short number strings as phone", () => {
      expect(detectContentKind("123").kind).not.toBe("phone_number");
    });
  });

  describe("datetime", () => {
    it("detects ISO 8601 dates", () => {
      expect(detectContentKind("2024-03-15").kind).toBe("datetime");
    });

    it("detects ISO 8601 with time", () => {
      expect(detectContentKind("2024-03-15T14:30:00Z").kind).toBe("datetime");
    });

    it("detects common slash date format", () => {
      expect(detectContentKind("15/03/2024").kind).toBe("datetime");
    });
  });

  describe("code_snippet", () => {
    it("detects JavaScript code", () => {
      const code = `function greet(name) {\n  return 'Hello, ' + name;\n}`;
      expect(detectContentKind(code).kind).toBe("code_snippet");
    });

    it("detects Python code", () => {
      const code = `def calculate(x, y):\n  return x + y\n\nresult = calculate(1, 2)`;
      expect(detectContentKind(code).kind).toBe("code_snippet");
    });
  });

  describe("address", () => {
    it("detects US address with street", () => {
      const addr = `123 Main Street\nNew York, NY 10001`;
      expect(detectContentKind(addr).kind).toBe("address");
    });
  });

  describe("text fallback", () => {
    it("returns text for plain sentences", () => {
      expect(detectContentKind("This is just a normal sentence.").kind).toBe("text");
    });

    it("returns text for empty-ish content", () => {
      expect(detectContentKind("hello").kind).toBe("text");
    });
  });
});

describe("getAutoActions", () => {
  it("returns actions for error_message", () => {
    const result = getAutoActions({ kind: "error_message", metadata: {} });
    expect(result.length).toBeGreaterThan(0);
    expect(result.some((a) => a.type === "search_error")).toBe(true);
  });

  it("returns actions for json", () => {
    const result = getAutoActions({ kind: "json", metadata: {} });
    expect(result.some((a) => a.type === "format_json")).toBe(true);
  });

  it("returns actions for color_hex with hex metadata", () => {
    const result = getAutoActions({ kind: "color_hex", metadata: { hex: "#FF5733" } });
    expect(result.some((a) => a.type === "copy_hex")).toBe(true);
    expect(result[0].payload.hex).toBe("#FF5733");
  });

  it("returns actions for cron_expression", () => {
    const result = getAutoActions({ kind: "cron_expression", metadata: { cron: "0 */6 * * *" } });
    expect(result.some((a) => a.type === "explain_cron")).toBe(true);
  });

  it("returns actions for regex_pattern", () => {
    const result = getAutoActions({ kind: "regex_pattern", metadata: { pattern: "/foo/gi" } });
    expect(result.some((a) => a.type === "explain_regex")).toBe(true);
  });

  it("returns empty array for text", () => {
    expect(getAutoActions({ kind: "text", metadata: {} })).toEqual([]);
  });
});
