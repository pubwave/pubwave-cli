import type { CliCommandContext, PubwaveCliConfig } from "../../../core/types.js";
import type { ErasedProjectConfig, SetupState } from "../types.js";
import { shouldRequireAiSetup } from "./steps.js";

export function stateToConfig(
  current: PubwaveCliConfig,
  state: SetupState,
  context: CliCommandContext<ErasedProjectConfig>,
  projectConfig: ErasedProjectConfig
): PubwaveCliConfig {
  const requireAiSetup = shouldRequireAiSetup(context, state, projectConfig, current);
  const nextConfig: PubwaveCliConfig = {
    ...current,
    language: state.language,
    ...(requireAiSetup
      ? {
          ai: {
            ...current.ai,
            modelSource: state.modelSource,
            provider: state.provider,
            model: state.model,
            apiKey: state.modelSource === "local" ? "" : state.apiKey
          }
        }
      : {})
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
