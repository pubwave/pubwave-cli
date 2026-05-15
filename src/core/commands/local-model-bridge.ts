import { installOllamaModel } from "../../features/models/ollama/install.js";
import type { CliCommandContext, PubwaveCliConfig } from "../types.js";

export async function ensureConfiguredLocalModel(context: CliCommandContext, config: PubwaveCliConfig) {
  if (config.ai?.modelSource !== "local" || config.ai.provider !== "local" || !config.ai.model) {
    return null;
  }

  if (!context.features.localModel.enabled) {
    return {
      ok: false,
      detail: "Local model support is disabled for this CLI."
    };
  }

  return installOllamaModel(config.ai.model, undefined, undefined, {
    autoInstallRuntime: context.features.localModel.autoInstallRuntime,
    autoStartRuntime: context.features.localModel.autoStartRuntime
  });
}
