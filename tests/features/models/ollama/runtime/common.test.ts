import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resolveOllamaApiBase } from "../../../../../src/features/models/ollama/runtime/common.js";

const originalHost = process.env.OLLAMA_HOST;

beforeEach(() => {
  delete process.env.OLLAMA_HOST;
});

afterEach(() => {
  if (originalHost === undefined) {
    delete process.env.OLLAMA_HOST;
  } else {
    process.env.OLLAMA_HOST = originalHost;
  }
});

describe("resolveOllamaApiBase", () => {
  it("defaults to localhost when OLLAMA_HOST is unset", () => {
    expect(resolveOllamaApiBase()).toBe("http://127.0.0.1:11434");
  });

  it("respects a fully qualified URL", () => {
    process.env.OLLAMA_HOST = "http://1.2.3.4:8000";
    expect(resolveOllamaApiBase()).toBe("http://1.2.3.4:8000");
  });

  it("adds http:// when the env value has no scheme", () => {
    process.env.OLLAMA_HOST = "1.2.3.4:8000";
    expect(resolveOllamaApiBase()).toBe("http://1.2.3.4:8000");
  });

  it("falls back to the default port when no port is given", () => {
    process.env.OLLAMA_HOST = "ollama.local";
    expect(resolveOllamaApiBase()).toBe("http://ollama.local:11434");
  });

  it("returns the default when the env value cannot be parsed as a URL", () => {
    process.env.OLLAMA_HOST = "::::not a url::::";
    expect(resolveOllamaApiBase()).toBe("http://127.0.0.1:11434");
  });

  it("ignores blank/whitespace-only env values", () => {
    process.env.OLLAMA_HOST = "   ";
    expect(resolveOllamaApiBase()).toBe("http://127.0.0.1:11434");
  });
});
