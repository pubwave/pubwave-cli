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
    // Always write the AI block so re-running setup keeps it in sync: when the
    // language needs AI, persist the chosen provider/model; when it does not
    // (the model step was skipped), clear them so stale values from a previous
    // run don't linger.
    ai: requireAiSetup
      ? {
          ...current.ai,
          modelSource: state.modelSource,
          provider: state.provider,
          model: state.model,
          apiKey: state.modelSource === "local" ? "" : state.apiKey
        }
      : {
          ...current.ai,
          provider: "",
          model: "",
          apiKey: ""
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
