import type { CliCommandContext, PubwaveCliConfig } from "../../../core/types.js";
import { defaultWizardLanguage, type WizardLocale } from "../../../shared/i18n/wizard/index.js";
import type { CustomSetupStep, SetupState } from "../types.js";

export function createInitialState(
  context: CliCommandContext,
  config: PubwaveCliConfig,
  detectedLocale: WizardLocale,
  projectConfig: unknown
): SetupState {
  const language = config.language ?? defaultWizardLanguage(detectedLocale);
  const defaultProvider = context.features.cloudModel.providers[0];
  const defaultModel = defaultProvider?.models[0];
  const defaultLocalModel = context.features.localModel.choices[0];
  // Use `||` (not `??`) so an unconfigured "" is treated as unset and falls back
  // to sensible defaults — otherwise the wizard would start with empty provider/
  // model and the cloud model list would be empty.
  const modelSource = config.ai?.modelSource || "cloud";

  const customValues: Record<string, unknown> = {};
  const customSteps = context.features.setup.customSteps as CustomSetupStep<unknown>[] | undefined;
  if (customSteps) {
    for (const step of customSteps) {
      customValues[step.id] = step.read(projectConfig, config);
    }
  }

  const provider = modelSource === "local" ? "local" : (config.ai?.provider || defaultProvider?.value || "openai");
  const model = config.ai?.model || (modelSource === "local" ? defaultLocalModel?.value : defaultModel?.value) || "";
  const cloudChoices = modelSource === "cloud"
    ? (context.features.cloudModel.providers.find((p) => p.value === provider)?.models ?? [])
    : [];
  const cloudModelInputMode = modelSource === "cloud"
    && model.length > 0
    && !cloudChoices.some((m) => m.value === model);

  return {
    language,
    modelSource,
    provider,
    model,
    cloudModelInputMode,
    ...(cloudModelInputMode && model.length > 0 ? { customModelDraft: model } : {}),
    apiKey: modelSource === "local" ? "" : (config.ai?.apiKey || ""),
    mobileInstall: config.mobile?.enabled === true ? "install" : "skip",
    customValues
  };
}
