import type { CliCommandContext, PubwaveCliConfig } from "../../../core/types.js";
import { isWizardLocale, wizardMessage, type WizardLocale } from "../../../shared/i18n/wizard/index.js";
import { installOllamaModel } from "../../models/ollama/install.js";
import { latestOllamaPullStatus, localModelProgressColor, localModelProgressText } from "../progress/output.js";
import type { ProgressLine } from "../types.js";

export async function ensureSetupLocalModel(
  context: CliCommandContext,
  config: PubwaveCliConfig,
  progress: {
    appendProgress: (text: string, color?: ProgressLine["color"], completedText?: string) => void;
    updateLastProgress?: (text: string, color?: ProgressLine["color"], completedText?: string) => void;
    appendOutput: (text: string, stream: "stdout" | "stderr") => void;
    setInstallMessage: (message: string | null) => void;
    resetProgress?: () => void;
    setStageTitle?: (title: string | null) => void;
  }
) {
  if (config.ai?.modelSource !== "local" || config.ai.provider !== "local" || !config.ai.model) {
    return null;
  }

  if (!context.features.localModel.enabled) {
    return {
      ok: false,
      detail: "Local model support is disabled for this CLI."
    };
  }

  const configLanguage = config.language;
  const locale: WizardLocale = configLanguage && isWizardLocale(configLanguage) ? configLanguage : "en";
  let enteredModelInstallStage = false;
  let currentStage: string | null = null;
  const result = await installOllamaModel(config.ai.model, (stage, model) => {
    currentStage = stage;
    const isOllamaStage = stage === "check-runtime"
      || stage === "install-runtime"
      || stage === "start-runtime"
      || stage === "wait-runtime";
    if (!isOllamaStage && !enteredModelInstallStage) {
      enteredModelInstallStage = true;
      progress.resetProgress?.();
    }
    progress.setStageTitle?.(
      isOllamaStage
        ? wizardMessage(locale, "setupOllamaInstalling")
        : wizardMessage(locale, "setupLocalModelInstalling")
    );
    progress.appendProgress(localModelProgressText(config.language, stage, model), localModelProgressColor(stage));
  }, (line, stream) => {
    if (currentStage === "install-runtime") {
      progress.appendOutput(line, stream);
      return;
    }

    if (currentStage === "pull-model") {
      const pullStatus = latestOllamaPullStatus(line);
      if (pullStatus) {
        progress.updateLastProgress?.(
          `${localModelProgressText(config.language, "pull-model", config.ai!.model!)} - ${pullStatus}`,
          "yellow"
        );
        return;
      }
    }

    progress.appendOutput(line, stream);
  }, {
    autoInstallRuntime: context.features.localModel.autoInstallRuntime,
    autoStartRuntime: context.features.localModel.autoStartRuntime,
    locale
  });
  progress.setInstallMessage(result.ok ? null : result.detail);
  return result;
}
