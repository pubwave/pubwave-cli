import React from "react";
import { MessageView, Panel, StatusLine } from "../../ui/index.js";
import {
  installOllamaModel,
  installedOllamaModels,
  isOllamaModelInstalled,
  uninstallOllamaModel
} from "../../features/models/ollama/index.js";
import type { CliCommand } from "../types.js";
import { stringOption } from "./command-options.js";

export function modelCommands(): CliCommand[] {
  return [
    {
      name: "model local list",
      description: "List installed local models.",
      run: async (context) => {
        if (!context.features.localModel.enabled) {
          return <MessageView title="Local Models" color="yellow" message="Local model support is disabled for this CLI." />;
        }
        const models = installedOllamaModels();
        return (
          <Panel title="Local Models">
            {models.length > 0
              ? models.map((model) => <StatusLine key={model.value} ok label={model.value} detail={model.description} />)
              : <StatusLine ok={false} label="ollama" detail="No local models found in Ollama." />}
          </Panel>
        );
      }
    },
    {
      name: "model local install",
      description: "Install a local model with Ollama.",
      options: ["model"],
      run: async (context, options) => {
        if (!context.features.localModel.enabled) {
          return <MessageView title="Local Model Install" color="yellow" message="Local model support is disabled for this CLI." />;
        }
        const model = stringOption(options.model) ?? context.features.localModel.choices[0]?.value;
        if (!model) {
          return <MessageView title="Local Model Install" color="red" message="Missing --model." />;
        }
        const result = await installOllamaModel(model, undefined, undefined, {
          autoInstallRuntime: context.features.localModel.autoInstallRuntime,
          autoStartRuntime: context.features.localModel.autoStartRuntime
        });
        return <MessageView title="Local Model Install" color={result.ok ? "green" : "red"} message={result.detail} />;
      }
    },
    {
      name: "model local use",
      description: "Save a local model as the configured model.",
      options: ["model"],
      run: async (context, options) => {
        const model = stringOption(options.model);
        if (!model) {
          return <MessageView title="Local Model Use" color="red" message="Missing --model." />;
        }
        if (!isOllamaModelInstalled(model)) {
          return <MessageView title="Local Model Use" color="yellow" message={`${model} is not installed in Ollama. Run \`${context.app.command} model local install --model=${model}\` first.`} />;
        }
        const next = await context.config.updateCliConfig((current) => ({
          ...current,
          ai: {
            ...current.ai,
            modelSource: "local",
            provider: "local",
            model,
            apiKey: ""
          }
        }));
        return <MessageView title="Local Model Use" color="green" message={`Using local model ${next.ai?.model}.`} />;
      }
    },
    {
      name: "model local uninstall",
      description: "Remove a local model from Ollama.",
      options: ["model"],
      run: (context, options) => {
        if (!context.features.localModel.enabled) {
          return <MessageView title="Local Model Uninstall" color="yellow" message="Local model support is disabled for this CLI." />;
        }
        const model = stringOption(options.model);
        if (!model) {
          return <MessageView title="Local Model Uninstall" color="red" message="Missing --model." />;
        }
        const result = uninstallOllamaModel(model);
        return <MessageView title="Local Model Uninstall" color={result.ok ? "green" : "red"} message={result.detail} />;
      }
    }
  ];
}
