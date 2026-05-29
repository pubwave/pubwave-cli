import { describe, expect, it } from "vitest";
import { resolveLocalModelServiceEnv } from "../../../../src/features/models/ollama/service-env.js";

describe("resolveLocalModelServiceEnv", () => {
  it("maps ollama to OLLAMA_HOST with the resolved host", () => {
    expect(resolveLocalModelServiceEnv("192.168.1.10:11434", "ollama"))
      .toEqual({ OLLAMA_HOST: "192.168.1.10:11434" });
  });

  it("passes a LAN IP through verbatim (so devices can reach the host)", () => {
    expect(resolveLocalModelServiceEnv("10.0.0.5", "ollama"))
      .toEqual({ OLLAMA_HOST: "10.0.0.5" });
  });
});
