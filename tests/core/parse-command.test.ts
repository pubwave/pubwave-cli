import { describe, expect, it } from "vitest";
import { parseCommand } from "../../src/core/parse-command.js";

describe("parseCommand", () => {
  it("joins positional tokens into a space-separated command", () => {
    expect(parseCommand(["model", "local", "list"]).command).toBe("model local list");
  });

  it("returns an empty command when no positionals are given", () => {
    const parsed = parseCommand([]);
    expect(parsed.command).toBe("");
    expect(parsed.options).toEqual({});
  });

  it("parses --key=value form", () => {
    expect(parseCommand(["--model=gpt-5"]).options).toEqual({ model: "gpt-5" });
  });

  it("parses --key value form and consumes the next token", () => {
    const parsed = parseCommand(["model", "local", "install", "--model", "qwen3:8b"]);
    expect(parsed.command).toBe("model local install");
    expect(parsed.options).toEqual({ model: "qwen3:8b" });
  });

  it("treats a trailing flag with no value as boolean true", () => {
    expect(parseCommand(["--help"]).options).toEqual({ help: true });
  });

  it("does not consume the next token when it is another flag", () => {
    expect(parseCommand(["--verbose", "--model=x"]).options).toEqual({ verbose: true, model: "x" });
  });

  it("keeps an explicit empty value from --key= ", () => {
    expect(parseCommand(["--model="]).options).toEqual({ model: "" });
  });

  it("ignores a bare -- with no key", () => {
    expect(parseCommand(["--", "model"]).options).toEqual({});
    expect(parseCommand(["--", "model"]).command).toBe("model");
  });

  it("last flag wins on duplicate keys", () => {
    expect(parseCommand(["--model=a", "--model=b"]).options).toEqual({ model: "b" });
  });
});
