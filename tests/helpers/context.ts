import { normalizeAppConfig, normalizeFeatures } from "../../src/core/normalize.js";
import type { CliCommandContext, CliFeatureConfig } from "../../src/core/types.js";
import type { SetupState } from "../../src/features/setup/types.js";

export function makeContext(features?: CliFeatureConfig): CliCommandContext {
  return {
    app: normalizeAppConfig({ name: "Test App", command: "test" }),
    features: normalizeFeatures(features),
    paths: {} as never,
    config: {} as never,
    write: () => {},
    _commands: []
  } as unknown as CliCommandContext;
}

export function makeState(overrides: Partial<SetupState> = {}): SetupState {
  return {
    language: "en",
    modelSource: "cloud",
    provider: "openai",
    model: "",
    cloudModelInputMode: false,
    apiKey: "",
    mobileInstall: "skip",
    customValues: {},
    ...overrides
  };
}
