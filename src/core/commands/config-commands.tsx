import React from "react";
import { ConfigView, MessageView } from "../../ui/index.js";
import type { CliCommand } from "../types.js";
import { applyConfigOptions, configItems } from "./command-options.js";
import { ensureConfiguredLocalModel } from "./local-model-bridge.js";

export function configGetCommand(): CliCommand {
  return {
    name: "config get",
    description: "Show CLI-managed configuration.",
    run: async (context) => {
      const config = await context.config.loadCliConfig();
      return <ConfigView title="Config" items={configItems(config)} />;
    }
  };
}

export function configSetCommand(): CliCommand {
  return {
    name: "config set",
    description: "Update CLI-managed configuration from flags.",
    options: ["language", "model-source", "provider", "model", "api-key", "mobile"],
    run: async (context, options) => {
      const current = await context.config.loadCliConfig();
      const next = applyConfigOptions(current, options);
      const localInstall = await ensureConfiguredLocalModel(context, next);
      if (localInstall && !localInstall.ok) {
        return <MessageView title="Config Updated" color="red" message={localInstall.detail} />;
      }
      await context.config.saveCliConfig(next);
      return <ConfigView title="Config Updated" items={configItems(next)} />;
    }
  };
}
