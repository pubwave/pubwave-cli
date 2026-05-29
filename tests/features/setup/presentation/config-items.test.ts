import { describe, expect, it } from "vitest";
import { resolveSavedViewRows, setupConfigItems } from "../../../../src/features/setup/presentation/config-items.js";
import { wizardMessage } from "../../../../src/shared/i18n/wizard/index.js";
import type { PubwaveCliConfig } from "../../../../src/core/types.js";

const config = {
  language: "en",
  ai: { modelSource: "cloud", provider: "openai", model: "gpt-5.2" }
} as PubwaveCliConfig;

describe("setupConfigItems", () => {
  it("lists the four core rows in order", () => {
    const items = setupConfigItems(config, "en", false);
    expect(items).toHaveLength(4);
    expect(items.map((i) => i.value)).toEqual(["en", "cloud", "openai", "gpt-5.2"]);
  });

  it("adds a mobile status row when mobile is enabled in the config", () => {
    const items = setupConfigItems({ ...config, mobile: { enabled: true } } as PubwaveCliConfig, "en", true);
    expect(items).toHaveLength(5);
    expect(items[4]!.value).toBe(wizardMessage("en", "mobileInstallEnabledStatus"));
  });

  it("shows the skipped status when mobile is included but disabled", () => {
    const items = setupConfigItems(config, "en", true);
    expect(items[4]!.value).toBe(wizardMessage("en", "mobileInstallSkippedStatus"));
  });

  it("appends host-provided additional rows", () => {
    const items = setupConfigItems(config, "en", false, [{ label: "Workspace", value: "/repo" }]);
    expect(items).toHaveLength(5);
    expect(items[4]).toEqual({ label: "Workspace", value: "/repo" });
  });
});

describe("resolveSavedViewRows", () => {
  it("returns an empty array for undefined", () => {
    expect(resolveSavedViewRows(undefined, {} as never)).toEqual([]);
  });

  it("passes arrays through unchanged", () => {
    const rows = [{ label: "a", value: "b" }];
    expect(resolveSavedViewRows(rows, {} as never)).toBe(rows);
  });

  it("invokes a builder function with the context", () => {
    const ctx = { marker: 1 } as never;
    const built = resolveSavedViewRows((received) => {
      expect(received).toBe(ctx);
      return [{ label: "x", value: "y" }];
    }, ctx);
    expect(built).toEqual([{ label: "x", value: "y" }]);
  });
});
