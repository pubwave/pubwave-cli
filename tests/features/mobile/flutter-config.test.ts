import { describe, expect, it } from "vitest";
import { normalizeFlutterConfig } from "../../../src/features/mobile/flutter/config.js";
import { firstLine } from "../../../src/features/mobile/flutter/utils.js";

describe("normalizeFlutterConfig", () => {
  it("returns false for falsy input", () => {
    expect(normalizeFlutterConfig(false)).toBe(false);
    expect(normalizeFlutterConfig(undefined)).toBe(false);
  });

  it("expands true into a default config with a workspace provider", () => {
    const config = normalizeFlutterConfig(true);
    expect(config).not.toBe(false);
    if (config) {
      expect(config).toMatchObject({ projectDir: "apps/mobile", flutterCommand: "flutter", autoInstallSdk: true });
      expect(config.workspaceProvider).toBeDefined();
    }
  });

  it("fills defaults for a partial object config", () => {
    const config = normalizeFlutterConfig({});
    if (config) {
      expect(config).toMatchObject({
        projectDir: "apps/mobile",
        flutterCommand: "flutter",
        releaseMode: true,
        physicalDevicesOnly: true,
        autoInstallSdk: true,
        sdkVersion: "3.38.5"
      });
      expect(config.dartDefines).toBeUndefined();
    }
  });

  it("respects explicit overrides", () => {
    const config = normalizeFlutterConfig({
      projectDir: "mobile_app",
      flutterCommand: "/opt/flutter/bin/flutter",
      releaseMode: false,
      autoInstallSdk: false,
      sdkVersion: "3.0.0"
    });
    expect(config).toMatchObject({
      projectDir: "mobile_app",
      flutterCommand: "/opt/flutter/bin/flutter",
      releaseMode: false,
      autoInstallSdk: false,
      sdkVersion: "3.0.0"
    });
  });

  it("keeps dartDefines only when provided", () => {
    const fn = () => ({ API: "x" });
    const config = normalizeFlutterConfig({ dartDefines: fn });
    if (config) {
      expect(config.dartDefines).toBe(fn);
    }
  });
});

describe("firstLine", () => {
  it("returns the first non-blank trimmed line", () => {
    expect(firstLine("\n  hello \nworld", "fb")).toBe("hello");
  });

  it("returns the fallback for blank/empty input", () => {
    expect(firstLine("", "fallback")).toBe("fallback");
    expect(firstLine("   \n  \n", "fallback")).toBe("fallback");
  });
});
