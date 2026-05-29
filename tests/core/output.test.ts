import { describe, expect, it } from "vitest";
import { formatKeyValue, formatUnknownCommand } from "../../src/core/output.js";

describe("formatKeyValue", () => {
  it("joins the title with key/value lines", () => {
    expect(formatKeyValue("Config", { language: "en", model: "gpt-5" }))
      .toBe("Config\nlanguage: en\nmodel: gpt-5");
  });

  it("skips undefined values", () => {
    expect(formatKeyValue("X", { a: 1, b: undefined, c: 3 }))
      .toBe("X\na: 1\nc: 3");
  });

  it("returns only the title when all values are undefined", () => {
    expect(formatKeyValue("Empty", { a: undefined })).toBe("Empty");
  });
});

describe("formatUnknownCommand", () => {
  it("includes the unknown command name when given", () => {
    expect(formatUnknownCommand("doit", "mycli"))
      .toBe("Unknown command: doit\nRun `mycli help` for available commands.");
  });

  it("prints just the help hint when no command was given", () => {
    expect(formatUnknownCommand("", "mycli"))
      .toBe("Run `mycli help` for available commands.");
  });
});
