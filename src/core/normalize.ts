import { defaultCloudModelProviders, defaultLanguages, defaultLocalModelChoices } from "../features/models/defaults/index.js";
import { normalizeFlutterConfig } from "../features/mobile/flutter/config.js";
import type { CliAppConfig, CliFeatureConfig, NormalizedFeatureConfig } from "./types.js";

export function normalizeAppConfig(app: CliAppConfig): Required<CliAppConfig> {
  return {
    name: app.name,
    command: app.command,
    homeDirName: app.homeDirName ?? `.${app.command}`,
    envPrefix: app.envPrefix ?? app.command.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase(),
    version: app.version ?? "0.0.0",
    workspaceMarkers: app.workspaceMarkers ?? ["package.json"]
  };
}

export function normalizeFeatures<TProjectConfig>(
  features: CliFeatureConfig<TProjectConfig> | undefined
): NormalizedFeatureConfig<TProjectConfig> {
  const setup = typeof features?.setup === "object" ? features.setup : {};
  const cloudModel = typeof features?.cloudModel === "object" ? features.cloudModel : {};
  const localModel = typeof features?.localModel === "object" ? features.localModel : {};
  const mobile = typeof features?.mobile === "object" ? features.mobile : features?.mobile === true ? { flutter: true } : undefined;

  const cloudProviders = normalizeCloudProviders(cloudModel.providers);

  return {
    setup: {
      enabled: features?.setup !== false,
      languages: setup.languages ?? defaultLanguages,
      customSteps: setup.customSteps ?? [],
      stages: setup.stages ?? [],
      shouldRequireAiSetup: setup.shouldRequireAiSetup ?? (() => true),
      configRows: setup.configRows ?? []
    },
    cloudModel: {
      enabled: features?.cloudModel !== false,
      providers: cloudProviders
    },
    localModel: {
      enabled: features?.localModel !== false,
      choices: localModel.choices ?? defaultLocalModelChoices,
      runtime: localModel.runtime ?? "ollama",
      autoInstallRuntime: localModel.autoInstallRuntime ?? true,
      autoStartRuntime: localModel.autoStartRuntime ?? true
    },
    mobile: mobile ? { flutter: normalizeFlutterConfig(mobile.flutter ?? true) || undefined } : false,
    ...(features?.runtime ? { runtime: features.runtime } : {})
  };
}

function normalizeCloudProviders(providers: NonNullable<Exclude<CliFeatureConfig["cloudModel"], boolean>>["providers"]) {
  if (!providers) {
    return defaultCloudModelProviders;
  }

  if (providers.length === 0) {
    return [];
  }

  if (typeof providers[0] === "string") {
    const allowed = new Set(providers as string[]);
    return defaultCloudModelProviders.filter((provider) => allowed.has(provider.value));
  }

  return providers as typeof defaultCloudModelProviders;
}
