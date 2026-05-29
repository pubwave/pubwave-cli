import { describe, expect, it } from "vitest";
import {
  applyConfigOptions,
  booleanOption,
  buildSetupConfigFromOptions,
  normalizeModelSource,
  stringOption
} from "../../../src/core/commands/command-options.js";
import { makeContext } from "../../helpers/context.js";
import type { PubwaveCliConfig } from "../../../src/core/types.js";

describe("stringOption / booleanOption / normalizeModelSource", () => {
  it("stringOption trims and rejects blank strings", () => {
    expect(stringOption("  x  ")).toBe("x");
    expect(stringOption("   ")).toBeUndefined();
    expect(stringOption(undefined)).toBeUndefined();
    expect(stringOption(true)).toBeUndefined();
  });

  it("booleanOption accepts the documented forms", () => {
    expect(booleanOption(true)).toBe(true);
    expect(booleanOption("install")).toBe(true);
    expect(booleanOption("skip")).toBe(false);
    expect(booleanOption("yes")).toBe(true);
    expect(booleanOption("no")).toBe(false);
    expect(booleanOption("maybe")).toBeUndefined();
  });

  it("normalizeModelSource rejects invalid values", () => {
    expect(normalizeModelSource("cloud")).toBe("cloud");
    expect(normalizeModelSource("local")).toBe("local");
    expect(normalizeModelSource("remote")).toBeUndefined();
    expect(normalizeModelSource(undefined)).toBeUndefined();
  });
});

describe("applyConfigOptions — model-source ordering (Fix #2)", () => {
  const current = { ai: { modelSource: "cloud", provider: "openai" } } as PubwaveCliConfig;

  it("keeps the current value when the flag is absent", () => {
    expect(applyConfigOptions(current, {}).ai!.modelSource).toBe("cloud");
  });

  it("accepts a valid override", () => {
    expect(applyConfigOptions(current, { "model-source": "local" }).ai!.modelSource).toBe("local");
  });

  it("preserves the current value when the flag is invalid (does not wipe to undefined)", () => {
    expect(applyConfigOptions(current, { "model-source": "remote" }).ai!.modelSource).toBe("cloud");
  });

  it("returns undefined when nothing is set anywhere", () => {
    expect(applyConfigOptions({} as PubwaveCliConfig, {}).ai!.modelSource).toBeUndefined();
  });
});

describe("buildSetupConfigFromOptions — model-source ordering (Fix #2)", () => {
  const ctx = makeContext();

  it("defaults to 'cloud' when nothing is configured", () => {
    expect(buildSetupConfigFromOptions(ctx, {} as PubwaveCliConfig, {}).ai!.modelSource).toBe("cloud");
  });

  it("preserves the current value when the flag is invalid", () => {
    const cfg = { ai: { modelSource: "local", model: "qwen3:8b" } } as PubwaveCliConfig;
    expect(buildSetupConfigFromOptions(ctx, cfg, { "model-source": "bogus" }).ai!.modelSource).toBe("local");
  });

  it("falls back to the 'cloud' default when the flag is invalid and no current is set", () => {
    expect(buildSetupConfigFromOptions(ctx, {} as PubwaveCliConfig, { "model-source": "bogus" }).ai!.modelSource).toBe("cloud");
  });

  it("accepts a valid value", () => {
    expect(buildSetupConfigFromOptions(ctx, {} as PubwaveCliConfig, { "model-source": "local" }).ai!.modelSource).toBe("local");
  });

  it("clears apiKey when the resolved modelSource is local", () => {
    expect(buildSetupConfigFromOptions(ctx, { ai: { apiKey: "leftover" } } as PubwaveCliConfig, { "model-source": "local" }).ai!.apiKey).toBe("");
  });
});
