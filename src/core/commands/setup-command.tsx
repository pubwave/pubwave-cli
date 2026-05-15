import React from "react";
import { ConfigView, MessageView } from "../../ui/index.js";
import { SetupWizard } from "../../features/setup/wizard.js";
import type { CliCommand } from "../types.js";
import { buildSetupConfigFromOptions, configItems } from "./command-options.js";
import { ensureConfiguredLocalModel } from "./local-model-bridge.js";

export function setupCommand(): CliCommand {
  return {
    name: "setup",
    description: "Save language, model, and mobile defaults.",
    options: ["language", "model-source", "provider", "model", "api-key", "mobile"],
    run: async (context, options) => {
      if (!context.features.setup.enabled) {
        return <MessageView title="Setup" color="yellow" message="Setup is disabled for this CLI." />;
      }

      if (Object.keys(options).length > 0) {
        const current = await context.config.loadCliConfig();
        const next = buildSetupConfigFromOptions(context, current, options);
        const localInstall = await ensureConfiguredLocalModel(context, next);
        if (localInstall && !localInstall.ok) {
          return <MessageView title="Setup" color="red" message={localInstall.detail} />;
        }
        await context.config.saveCliConfig(next);
        return <ConfigView title="Setup Saved" items={configItems(next)} />;
      }

      const projectConfig = await context.config.loadProjectConfig();
      const initialConfig = await context.config.loadCliConfig();
      return <SetupWizard context={context} initialConfig={initialConfig} projectConfig={projectConfig} />;
    }
  };
}
