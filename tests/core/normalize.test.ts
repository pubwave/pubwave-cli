import { describe, expect, it } from "vitest";
import { normalizeAppConfig, normalizeFeatures } from "../../src/core/normalize.js";
import {
  defaultCloudModelProviders,
  defaultLanguages,
  defaultLocalModelChoices
} from "../../src/features/models/defaults/index.js";

describe("normalizeAppConfig", () => {
  it("fills sensible defaults from command", () => {
    const app = normalizeAppConfig({ name: "My App", command: "myapp" });
    expect(app.homeDirName).toBe(".myapp");
    expect(app.envPrefix).toBe("MYAPP");
    expect(app.version).toBe("0.0.0");
    expect(app.workspaceMarkers).toEqual(["package.json"]);
  });

  it("sanitizes non-alphanumeric command chars in envPrefix", () => {
    expect(normalizeAppConfig({ name: "X", command: "pub-wave.cli" }).envPrefix).toBe("PUB_WAVE_CLI");
  });

  it("keeps explicit overrides", () => {
    const app = normalizeAppConfig({
      name: "X",
      command: "x",
      homeDirName: ".custom",
      envPrefix: "ZZZ",
      version: "1.2.3",
      workspaceMarkers: ["pubspec.yaml"]
    });
    expect(app).toMatchObject({ homeDirName: ".custom", envPrefix: "ZZZ", version: "1.2.3", workspaceMarkers: ["pubspec.yaml"] });
  });
});

describe("normalizeFeatures", () => {
  it("enables setup/cloud/local by default with defaults applied", () => {
    const f = normalizeFeatures(undefined);
    expect(f.setup.enabled).toBe(true);
    expect(f.setup.languages).toEqual(defaultLanguages);
    expect(f.setup.customSteps).toEqual([]);
    expect(f.cloudModel.enabled).toBe(true);
    expect(f.cloudModel.providers).toEqual(defaultCloudModelProviders);
    expect(f.localModel.enabled).toBe(true);
    expect(f.localModel.choices).toEqual(defaultLocalModelChoices);
    expect(f.localModel.autoInstallRuntime).toBe(true);
    expect(f.localModel.autoStartRuntime).toBe(true);
    expect(f.mobile).toBe(false);
  });

  it("disables a feature when explicitly false", () => {
    expect(normalizeFeatures({ setup: false }).setup.enabled).toBe(false);
    expect(normalizeFeatures({ cloudModel: false }).cloudModel.enabled).toBe(false);
    expect(normalizeFeatures({ localModel: false }).localModel.enabled).toBe(false);
  });

  it("defaults shouldRequireAiSetup to always-true", () => {
    const fn = normalizeFeatures(undefined).setup.shouldRequireAiSetup;
    expect(fn({ state: {} as never, projectConfig: {}, cliConfig: {} })).toBe(true);
  });

  it("filters cloud providers given as a string allow-list, preserving default order", () => {
    const providers = normalizeFeatures({ cloudModel: { providers: ["anthropic", "openai"] } }).cloudModel.providers;
    expect(providers.map((p) => p.value)).toEqual(["openai", "anthropic"]);
  });

  it("returns no cloud providers when given an empty array", () => {
    expect(normalizeFeatures({ cloudModel: { providers: [] } }).cloudModel.providers).toEqual([]);
  });

  it("normalizes mobile:true into a flutter config object", () => {
    const f = normalizeFeatures({ mobile: true });
    expect(f.mobile).not.toBe(false);
    if (f.mobile) {
      expect(f.mobile.flutter).toMatchObject({ projectDir: "apps/mobile", flutterCommand: "flutter" });
    }
  });
});
