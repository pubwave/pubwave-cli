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
  const modelSource = config.ai?.modelSource ?? "cloud";

  const customValues: Record<string, unknown> = {};
  const customSteps = context.features.setup.customSteps as CustomSetupStep<unknown>[] | undefined;
  if (customSteps) {
    for (const step of customSteps) {
      customValues[step.id] = step.read(projectConfig, config);
    }
  }

  return {
    language,
    modelSource,
    provider: modelSource === "local" ? "local" : config.ai?.provider ?? defaultProvider?.value ?? "openai",
    model: config.ai?.model ?? (modelSource === "local" ? defaultLocalModel?.value : defaultModel?.value) ?? "",
    cloudModelInputMode: false,
    apiKey: modelSource === "local" ? "" : config.ai?.apiKey ?? "",
    mobileInstall: config.mobile?.enabled === false ? "skip" : "install",
    customValues
  };
}
