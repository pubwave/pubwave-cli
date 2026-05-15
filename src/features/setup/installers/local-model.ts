import type { CliCommandContext, PubwaveCliConfig } from "../../../core/types.js";
import { installOllamaModel } from "../../models/ollama/install.js";
import { localModelProgressColor, localModelProgressText } from "../progress/output.js";
import type { ProgressLine } from "../types.js";

export async function ensureSetupLocalModel(
  context: CliCommandContext,
  config: PubwaveCliConfig,
  progress: {
    appendProgress: (text: string, color?: ProgressLine["color"], completedText?: string) => void;
    appendOutput: (text: string, stream: "stdout" | "stderr") => void;
    setInstallMessage: (message: string | null) => void;
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

  const result = await installOllamaModel(config.ai.model, (stage, model) => {
    progress.appendProgress(localModelProgressText(config.language, stage, model), localModelProgressColor(stage));
  }, (line, stream) => {
    progress.appendOutput(line, stream);
  }, {
    autoInstallRuntime: context.features.localModel.autoInstallRuntime,
    autoStartRuntime: context.features.localModel.autoStartRuntime
  });
  progress.setInstallMessage(result.ok ? null : result.detail);
  return result;
}
