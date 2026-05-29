import { describe, expect, it } from "vitest";
import { createInitialState } from "../../../../src/features/setup/state/initial-state.js";
import { makeContext } from "../../../helpers/context.js";
import type { PubwaveCliConfig } from "../../../../src/core/types.js";

const ctx = makeContext();

describe("createInitialState", () => {
  it("defaults to detected language, cloud source, first provider/model", () => {
    const state = createInitialState(ctx, {} as PubwaveCliConfig, "en", undefined);
    expect(state).toMatchObject({
      language: "en",
      modelSource: "cloud",
      provider: "openai",
      model: "gpt-5.2",
      cloudModelInputMode: false,
      apiKey: "",
      mobileInstall: "skip"
    });
  });

  it("enters inline input mode for a custom cloud model not in the list", () => {
    const config = { ai: { modelSource: "cloud", provider: "openai", model: "my-custom-model" } } as PubwaveCliConfig;
    const state = createInitialState(ctx, config, "en", undefined);
    expect(state.cloudModelInputMode).toBe(true);
    expect(state.customModelDraft).toBe("my-custom-model");
  });

  it("forces provider=local and blanks apiKey for a local config", () => {
    const config = { ai: { modelSource: "local", model: "qwen3:8b", apiKey: "leftover" } } as PubwaveCliConfig;
    const state = createInitialState(ctx, config, "en", undefined);
    expect(state).toMatchObject({ modelSource: "local", provider: "local", model: "qwen3:8b", apiKey: "" });
    expect(state.cloudModelInputMode).toBe(false);
  });

  it("falls back to the first local choice when a local config has no model", () => {
    const config = { ai: { modelSource: "local" } } as PubwaveCliConfig;
    const state = createInitialState(ctx, config, "en", undefined);
    expect(state.model).toBe(ctx.features.localModel.choices[0]!.value);
  });

  it("maps a mobile-enabled config to mobileInstall=install", () => {
    const config = { mobile: { enabled: true } } as PubwaveCliConfig;
    expect(createInitialState(ctx, config, "en", undefined).mobileInstall).toBe("install");
  });

  it("reads custom step initial values from the project config", () => {
    const customCtx = makeContext({
      setup: {
        customSteps: [
          {
            id: "team",
            kind: "choice",
            title: "Team",
            read: () => "acme",
            write: async (projectConfig) => ({ projectConfig })
          }
        ]
      }
    });
    const state = createInitialState(customCtx, {} as PubwaveCliConfig, "en", {});
    expect(state.customValues.team).toBe("acme");
  });
});
