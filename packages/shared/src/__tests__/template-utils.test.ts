import { describe, it, expect } from "vitest";
import { extractVariables, fillTemplate } from "../template-utils";

describe("extractVariables", () => {
  it("detects a single variable", () => {
    expect(extractVariables("Hello {name}!")).toEqual(["name"]);
  });

  it("detects multiple distinct variables", () => {
    expect(extractVariables("Dear {name}, regarding {thema}, see you on {datum}.")).toEqual([
      "name",
      "thema",
      "datum",
    ]);
  });

  it("deduplicates repeated variables", () => {
    expect(extractVariables("{foo} and {foo} again")).toEqual(["foo"]);
  });

  it("preserves insertion order", () => {
    expect(extractVariables("{z} {a} {m}")).toEqual(["z", "a", "m"]);
  });

  it("returns empty array when no variables present", () => {
    expect(extractVariables("No variables here")).toEqual([]);
  });

  it("returns empty array for empty string", () => {
    expect(extractVariables("")).toEqual([]);
  });

  it("handles multi-line template content", () => {
    const content = `Hallo {name},\n\ndanke fuer deine Nachricht bezueglich {thema}.\nBis {datum},\n{absender}`;
    expect(extractVariables(content)).toEqual(["name", "thema", "datum", "absender"]);
  });

  it("ignores non-word characters inside braces", () => {
    // {foo-bar} is not matched because hyphens are not \\w
    expect(extractVariables("{foo-bar} {valid}")).toEqual(["valid"]);
  });

  it("handles adjacent variables", () => {
    expect(extractVariables("{first}{last}")).toEqual(["first", "last"]);
  });
});

describe("fillTemplate", () => {
  it("replaces a single variable", () => {
    expect(fillTemplate("Hello {name}!", { name: "Alice" })).toBe("Hello Alice!");
  });

  it("replaces multiple variables", () => {
    expect(
      fillTemplate("Dear {name}, see you on {datum}.", { name: "Bob", datum: "Friday" }),
    ).toBe("Dear Bob, see you on Friday.");
  });

  it("replaces repeated variables", () => {
    expect(fillTemplate("{x} and {x}", { x: "yo" })).toBe("yo and yo");
  });

  it("leaves unmatched variables unchanged", () => {
    expect(fillTemplate("Hello {name}!", {})).toBe("Hello {name}!");
  });

  it("handles empty variables map", () => {
    expect(fillTemplate("No vars here", {})).toBe("No vars here");
  });

  it("handles empty content", () => {
    expect(fillTemplate("", { name: "Alice" })).toBe("");
  });
});
