import { describe, expect, it } from "vitest";
import { createPubwaveCli, hasSavedSetupConfig } from "../../src/core/create-pubwave-cli.js";
import type { CliFeatureConfig, PubwaveCliConfig } from "../../src/core/types.js";

function commandNames(features: CliFeatureConfig): string[] {
  const cli = createPubwaveCli({
    app: { name: "Test", command: "test" },
    config: { load: async () => ({}), save: async () => {} } as never,
    features
  });
  return cli.listCommands().map((c) => c.name);
}

describe("hasSavedSetupConfig", () => {
  it("is false for an empty config", () => {
    expect(hasSavedSetupConfig({} as PubwaveCliConfig)).toBe(false);
  });

  it("is false when ai exists but has no meaningful fields", () => {
    expect(hasSavedSetupConfig({ ai: {} } as PubwaveCliConfig)).toBe(false);
  });

  it("is true when any setup-derived field is present", () => {
    expect(hasSavedSetupConfig({ language: "en" } as PubwaveCliConfig)).toBe(true);
    expect(hasSavedSetupConfig({ ai: { model: "gpt-5" } } as PubwaveCliConfig)).toBe(true);
    expect(hasSavedSetupConfig({ mobile: { enabled: false } } as PubwaveCliConfig)).toBe(true);
  });
});

describe("createPubwaveCli command filtering", () => {
  it("excludes `model local *` commands when localModel is disabled", () => {
    const names = commandNames({ setup: true, localModel: false });
    expect(names.some((n) => n.startsWith("model local"))).toBe(false);
    expect(names).toContain("setup");
  });

  it("includes `model local *` commands when localModel is enabled", () => {
    expect(commandNames({ localModel: true }).some((n) => n.startsWith("model local"))).toBe(true);
  });

  it("includes mobile commands only when mobile is enabled", () => {
    expect(commandNames({ mobile: true }).some((n) => n.startsWith("mobile"))).toBe(true);
    expect(commandNames({ mobile: false }).some((n) => n.startsWith("mobile"))).toBe(false);
  });

  it("excludes the setup command when setup is disabled", () => {
    expect(commandNames({ setup: false })).not.toContain("setup");
  });
});
