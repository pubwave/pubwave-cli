import type { CliCommandContext, PubwaveCliConfig } from "../../../core/types.js";
import type { SetupState } from "../types.js";

export function stateToConfig(current: PubwaveCliConfig, state: SetupState, context: CliCommandContext): PubwaveCliConfig {
  const nextConfig: PubwaveCliConfig = {
    ...current,
    language: state.language,
    ai: {
      ...current.ai,
      modelSource: state.modelSource,
      provider: state.provider,
      model: state.model,
      apiKey: state.modelSource === "local" ? "" : state.apiKey
    }
  };

  if (!context.features.mobile) {
    return nextConfig;
  }

  return {
    ...nextConfig,
    mobile: {
      ...current.mobile,
      enabled: state.mobileInstall === "install"
    }
  };
}
