import type { CliCommandContext, PubwaveCliConfig } from "../types.js";

export function stringOption(value: string | boolean | undefined): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function booleanOption(value: string | boolean | undefined): boolean | undefined {
  if (value === true) {
    return true;
  }
  if (value === false) {
    return false;
  }
  if (value === "true" || value === "1" || value === "yes" || value === "install") {
    return true;
  }
  if (value === "false" || value === "0" || value === "no" || value === "skip") {
    return false;
  }
  return undefined;
}

export function normalizeModelSource(value: string | undefined): "cloud" | "local" | undefined {
  return value === "local" || value === "cloud" ? value : undefined;
}

export function applyConfigOptions(current: PubwaveCliConfig, options: Record<string, string | boolean>): PubwaveCliConfig {
  return {
    ...current,
    language: stringOption(options.language) ?? current.language,
    ai: {
      ...current.ai,
      modelSource: normalizeModelSource(stringOption(options["model-source"])) ?? current.ai?.modelSource,
      provider: stringOption(options.provider) ?? current.ai?.provider,
      model: stringOption(options.model) ?? current.ai?.model,
      apiKey: stringOption(options["api-key"]) ?? current.ai?.apiKey
    },
    mobile: {
      ...current.mobile,
      enabled: booleanOption(options.mobile) ?? current.mobile?.enabled
    }
  };
}

export function buildSetupConfigFromOptions(
  context: CliCommandContext,
  current: PubwaveCliConfig,
  options: Record<string, string | boolean>
): PubwaveCliConfig {
  const language = stringOption(options.language) ?? current.language ?? context.features.setup.languages[0]?.value ?? "en";
  const defaultProvider = context.features.cloudModel.providers[0];
  const defaultModel = defaultProvider?.models[0];
  const defaultLocalModel = context.features.localModel.choices[0];
  const modelSource = normalizeModelSource(stringOption(options["model-source"])) ?? current.ai?.modelSource ?? "cloud";
  const provider = modelSource === "local" ? "local" : stringOption(options.provider) ?? current.ai?.provider ?? defaultProvider?.value ?? "openai";
  const model = stringOption(options.model)
    ?? current.ai?.model
    ?? (modelSource === "local" ? defaultLocalModel?.value : defaultModel?.value)
    ?? "";

  return {
    ...current,
    language,
    ai: {
      ...current.ai,
      modelSource,
      provider,
      model,
      apiKey: modelSource === "local" ? "" : stringOption(options["api-key"]) ?? current.ai?.apiKey ?? ""
    },
    mobile: {
      ...current.mobile,
      enabled: booleanOption(options.mobile) ?? current.mobile?.enabled ?? Boolean(context.features.mobile)
    }
  };
}

export function configItems(config: PubwaveCliConfig) {
  // Show "Not configured" when AI hasn't been set up (no provider/model) instead
  // of a stale default or a blank value.
  const aiConfigured = Boolean(config.ai?.provider && config.ai?.model);
  const notConfigured = "Not configured";
  return [
    { label: "Language", value: config.language },
    { label: "Model source", value: aiConfigured ? config.ai?.modelSource : notConfigured },
    { label: "Provider", value: aiConfigured ? config.ai?.provider : notConfigured },
    { label: "Model", value: aiConfigured ? config.ai?.model : notConfigured },
    { label: "Mobile enabled", value: config.mobile?.enabled }
  ];
}
