import { describe, expect, it } from "vitest";
import { stateToConfig } from "../../../../src/features/setup/state/state-to-config.js";
import { makeContext, makeState } from "../../../helpers/context.js";
import type { PubwaveCliConfig } from "../../../../src/core/types.js";

describe("stateToConfig", () => {
  it("writes language and cloud AI settings", () => {
    const ctx = makeContext();
    const next = stateToConfig({} as PubwaveCliConfig, makeState({ language: "fr", provider: "openai", model: "gpt-5", apiKey: "sk" }), ctx, {});
    expect(next.language).toBe("fr");
    expect(next.ai).toMatchObject({ modelSource: "cloud", provider: "openai", model: "gpt-5", apiKey: "sk" });
  });

  it("blanks the apiKey for local model source", () => {
    const ctx = makeContext();
    const next = stateToConfig({} as PubwaveCliConfig, makeState({ modelSource: "local", provider: "local", model: "qwen3:8b", apiKey: "leftover" }), ctx, {});
    expect(next.ai!.apiKey).toBe("");
  });

  it("omits AI settings when shouldRequireAiSetup is false", () => {
    const ctx = makeContext({ setup: { shouldRequireAiSetup: () => false } });
    const next = stateToConfig({} as PubwaveCliConfig, makeState(), ctx, {});
    expect(next.ai).toBeUndefined();
    expect(next.language).toBe("en");
  });

  it("omits the mobile section when mobile is not a feature", () => {
    const ctx = makeContext();
    expect(stateToConfig({} as PubwaveCliConfig, makeState(), ctx, {}).mobile).toBeUndefined();
  });

  it("reflects the mobile install choice when mobile is enabled", () => {
    const ctx = makeContext({ mobile: true });
    expect(stateToConfig({} as PubwaveCliConfig, makeState({ mobileInstall: "install" }), ctx, {}).mobile!.enabled).toBe(true);
    expect(stateToConfig({} as PubwaveCliConfig, makeState({ mobileInstall: "skip" }), ctx, {}).mobile!.enabled).toBe(false);
  });

  it("preserves unrelated existing config fields", () => {
    const ctx = makeContext();
    const next = stateToConfig({ telemetry: false } as unknown as PubwaveCliConfig, makeState(), ctx, {});
    expect((next as Record<string, unknown>).telemetry).toBe(false);
  });
});
