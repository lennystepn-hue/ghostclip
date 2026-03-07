import { describe, it, expect } from "vitest";
import { fuzzyMatch, parseFilterQuery } from "../quick-panel-utils";

describe("fuzzyMatch", () => {
  it("matches when query chars appear in order", () => {
    expect(fuzzyMatch("clipboard history", "clip")).toBe(true);
    expect(fuzzyMatch("clipboard history", "chis")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(fuzzyMatch("Hello World", "helo")).toBe(true);
    expect(fuzzyMatch("UPPER", "upr")).toBe(true);
  });

  it("returns true for empty query", () => {
    expect(fuzzyMatch("anything", "")).toBe(true);
    expect(fuzzyMatch("", "")).toBe(true);
  });

  it("returns false when chars are missing", () => {
    expect(fuzzyMatch("hello", "xyz")).toBe(false);
  });

  it("returns false when order is wrong", () => {
    expect(fuzzyMatch("abc", "cba")).toBe(false);
  });

  it("returns false when query is longer than text", () => {
    expect(fuzzyMatch("hi", "hello")).toBe(false);
  });
});

describe("parseFilterQuery", () => {
  it("extracts a tag filter", () => {
    const r = parseFilterQuery("#work meeting");
    expect(r.tag).toBe("work");
    expect(r.query).toBe("meeting");
    expect(r.app).toBeNull();
    expect(r.type).toBeNull();
  });

  it("extracts an app filter", () => {
    const r = parseFilterQuery("@chrome notes");
    expect(r.app).toBe("chrome");
    expect(r.query).toBe("notes");
    expect(r.tag).toBeNull();
  });

  it("extracts t:url type filter", () => {
    const r = parseFilterQuery("t:url github");
    expect(r.type).toBe("url");
    expect(r.query).toBe("github");
  });

  it("extracts t:image type filter", () => {
    expect(parseFilterQuery("t:image").type).toBe("image");
  });

  it("extracts t:text type filter", () => {
    expect(parseFilterQuery("t:text notes").type).toBe("text");
  });

  it("maps u: alias to url type", () => {
    expect(parseFilterQuery("u:anything").type).toBe("url");
  });

  it("maps i: alias to image type", () => {
    expect(parseFilterQuery("i:anything").type).toBe("image");
  });

  it("handles all filters together", () => {
    const r = parseFilterQuery("#dev @vscode t:code refactor");
    expect(r.tag).toBe("dev");
    expect(r.app).toBe("vscode");
    expect(r.type).toBe("code");
    expect(r.query).toBe("refactor");
  });

  it("returns empty query when input is only filter tokens", () => {
    const r = parseFilterQuery("#tag @app t:url");
    expect(r.query).toBe("");
  });

  it("returns empty filter for plain query", () => {
    const r = parseFilterQuery("some plain text");
    expect(r.tag).toBeNull();
    expect(r.app).toBeNull();
    expect(r.type).toBeNull();
    expect(r.query).toBe("some plain text");
  });

  it("handles empty input", () => {
    const r = parseFilterQuery("");
    expect(r.tag).toBeNull();
    expect(r.app).toBeNull();
    expect(r.type).toBeNull();
    expect(r.query).toBe("");
  });

  it("ignores lone # or @ without a value", () => {
    const r = parseFilterQuery("# @ hello");
    expect(r.tag).toBeNull();
    expect(r.app).toBeNull();
    expect(r.query).toBe("# @ hello");
  });

  it("is case-insensitive for type prefix", () => {
    expect(parseFilterQuery("T:URL").type).toBe("url");
    expect(parseFilterQuery("T:Image").type).toBe("image");
  });
});
