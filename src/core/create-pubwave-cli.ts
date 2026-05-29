import { builtInCommands } from "./commands/index.js";
import React from "react";
import { loadCliConfig, saveCliConfig } from "./config/adapter.js";
import { normalizeAppConfig, normalizeFeatures } from "./normalize.js";
import { resolveCliPaths } from "./paths.js";
import { formatUnknownCommand } from "./output.js";
import { parseCommand } from "./parse-command.js";
import { isReactElement, renderInk, unknownResultView } from "../ui/index.js";
import { MobileDeviceSelectView } from "./commands/mobile-device-select-view.js";
import { SavedSetupView } from "../features/setup/components/saved-view.js";
import { SetupWizard } from "../features/setup/wizard.js";
import type {
  CliCommand,
  CliCommandContext,
  CreatePubwaveCliOptions,
  DefaultCommand,
  DefaultCommandContext,
  NormalizedFeatureConfig,
  PubwaveCli,
  PubwaveCliConfig,
  SavedViewOverrides
} from "./types.js";

export function createPubwaveCli<TProjectConfig = PubwaveCliConfig>(
  options: CreatePubwaveCliOptions<TProjectConfig>
): PubwaveCli<TProjectConfig> {
  const app = normalizeAppConfig(options.app);
  const features = normalizeFeatures(options.features);
  const paths = resolveCliPaths(app);
  if (features.mobile && features.mobile.flutter && features.mobile.flutter !== true) {
    features.mobile.flutter.runtimeRoot = paths.runtimeRoot;
  }
  const configAdapter = resolveConfigAdapter(options.config, { app, paths });
  const dedupedCommands = dedupeCommandsByName([
    ...builtInCommands(),
    ...(options.commands ?? [])
  ] as CliCommand<TProjectConfig>[]);
  const commands = filterCommandsForFeatures(dedupedCommands, features);
  const commandByName = new Map(commands.map((command) => [command.name, command]));

  const context: CliCommandContext<TProjectConfig> = {
    app,
    features,
    paths,
    config: {
      async loadProjectConfig() {
        return await configAdapter.load();
      },
      async loadCliConfig() {
        return (await loadCliConfig(configAdapter)).cliConfig;
      },
      async saveCliConfig(config) {
        await saveCliConfig(configAdapter, config);
      },
      async saveProjectConfig(next) {
        await configAdapter.save(next);
      },
      async mergeCliConfig(cliConfig, baseProjectConfig) {
        if (configAdapter.fromCliConfig) {
          return await configAdapter.fromCliConfig(cliConfig, baseProjectConfig);
        }
        return { ...baseProjectConfig, ...cliConfig } as TProjectConfig;
      },
      async updateCliConfig(updater) {
        const current = (await loadCliConfig(configAdapter)).cliConfig;
        const next = updater(current);
        await saveCliConfig(configAdapter, next);
        return next;
      }
    },
    write(message) {
      process.stdout.write(`${message}\n`);
    },
    _commands: commands
  };

  return {
    async run(argv = process.argv.slice(2)) {
      const parsed = parseCommand(argv);
      const commandName = parsed.command;

      if (parsed.options.help === true) {
        const help = commandByName.get("help");
        await runCommand(help, context, {});
        return;
      }

      if (parsed.options.version === true) {
        const version = commandByName.get("version");
        await runCommand(version, context, {});
        return;
      }

      if (commandName === "") {
        if (features.setup.enabled && process.stdin.isTTY && process.stdout.isTTY) {
          const projectConfig = await context.config.loadProjectConfig();
          const initialConfig = await context.config.loadCliConfig();
          const setupContext = context as unknown as CliCommandContext;
          const element = await resolveDefaultCommand(
            options.defaultCommand,
            context,
            setupContext,
            initialConfig,
            projectConfig
          );
          if (element) {
            await renderInk(element, { fullscreen: isFullscreenView(element) });
            return;
          }
        }

        const help = commandByName.get("help");
        await runCommand(help, context, {});
        return;
      }

      const command = commandByName.get(commandName);
      if (!command) {
        await renderInk(unknownResultView(app.name, formatUnknownCommand(parsed.command, app.command)));
        return;
      }

      await runCommand(command, context, parsed.options);
    },
    listCommands() {
      return commands;
    }
  };
}

// Interactive, long-lived views that redraw and must own the whole viewport.
// Static one-shot views (help, config, messages) render normally so their
// output stays in the scrollback after exit.
const FULLSCREEN_VIEWS: ReadonlyArray<React.ElementType> = [
  SetupWizard,
  SavedSetupView,
  MobileDeviceSelectView
];

function isFullscreenView(element: React.ReactElement): boolean {
  return FULLSCREEN_VIEWS.includes(element.type as React.ElementType);
}

function resolveConfigAdapter<TProjectConfig>(
  config: CreatePubwaveCliOptions<TProjectConfig>["config"],
  context: Pick<CliCommandContext<TProjectConfig>, "app" | "paths">
) {
  return typeof config === "function" ? config(context) : config;
}

async function runCommand<TProjectConfig>(
  command: CliCommand<TProjectConfig> | undefined,
  context: CliCommandContext<TProjectConfig>,
  options: Record<string, string | boolean>
): Promise<void> {
  if (!command) {
    return;
  }

  const result = await command.run(context, options);
  if (isReactElement(result)) {
    await renderInk(result, { fullscreen: isFullscreenView(result) });
    return;
  }

  if (typeof result === "string") {
    await renderInk(unknownResultView(context.app.name, result));
    return;
  }

  if (result !== undefined) {
    await renderInk(unknownResultView(context.app.name, result));
  }
}

function dedupeCommandsByName<TProjectConfig>(
  commands: CliCommand<TProjectConfig>[]
): CliCommand<TProjectConfig>[] {
  const byName = new Map<string, CliCommand<TProjectConfig>>();
  for (const command of commands) {
    byName.set(command.name, command);
  }
  return [...byName.values()];
}

function filterCommandsForFeatures<TProjectConfig>(
  commands: CliCommand<TProjectConfig>[],
  features: NormalizedFeatureConfig<TProjectConfig>
): CliCommand<TProjectConfig>[] {
  return commands.filter((command) => {
    if (command.name === "setup") {
      return features.setup.enabled;
    }
    if (command.name.startsWith("model local")) {
      return features.localModel.enabled;
    }
    if (command.name.startsWith("mobile")) {
      return Boolean(features.mobile && features.mobile.flutter);
    }
    if (["launch", "status", "down", "logs"].includes(command.name)) {
      return Boolean(features.runtime?.[runtimeKey(command.name)]);
    }
    return true;
  });
}

function runtimeKey(commandName: string): "launch" | "status" | "stop" | "logs" {
  if (commandName === "down") {
    return "stop";
  }
  return commandName as "launch" | "status" | "logs";
}

export function hasSavedSetupConfig(config: PubwaveCliConfig): boolean {
  return Boolean(
    config.language
      || config.ai?.modelSource
      || config.ai?.provider
      || config.ai?.model
      || config.mobile?.enabled !== undefined
  );
}

export function renderSetupWizard<TProjectConfig>(
  context: CliCommandContext<TProjectConfig>,
  initialConfig: PubwaveCliConfig,
  projectConfig: TProjectConfig
): React.ReactElement {
  const setupContext = context as unknown as CliCommandContext;
  return React.createElement(SetupWizard, { context: setupContext, initialConfig, projectConfig });
}

export function renderSavedView<TProjectConfig>(
  context: CliCommandContext<TProjectConfig>,
  initialConfig: PubwaveCliConfig,
  projectConfig: TProjectConfig,
  overrides?: SavedViewOverrides<TProjectConfig>
): React.ReactElement {
  const setupContext = context as unknown as CliCommandContext;
  return React.createElement(SavedSetupView, {
    context: setupContext,
    initialConfig,
    projectConfig,
    overrides: overrides as SavedViewOverrides | undefined
  });
}

async function resolveDefaultCommand<TProjectConfig>(
  defaultCommand: DefaultCommand<TProjectConfig> | undefined,
  context: CliCommandContext<TProjectConfig>,
  setupContext: CliCommandContext,
  initialConfig: PubwaveCliConfig,
  projectConfig: TProjectConfig
): Promise<React.ReactElement | null> {
  const strategy = defaultCommand ?? "setup-or-saved-view";

  if (strategy === "setup-only") {
    return React.createElement(SetupWizard, { context: setupContext, initialConfig, projectConfig });
  }

  if (strategy === "setup-or-saved-view") {
    return hasSavedSetupConfig(initialConfig)
      ? React.createElement(SavedSetupView, {
          context: setupContext,
          initialConfig,
          projectConfig
        })
      : React.createElement(SetupWizard, {
          context: setupContext,
          initialConfig,
          projectConfig
        });
  }

  const hookContext: DefaultCommandContext<TProjectConfig> = {
    context,
    initialConfig,
    hasSavedSetupConfig: hasSavedSetupConfig(initialConfig),
    renderSetupWizard: () => React.createElement(SetupWizard, { context: setupContext, initialConfig, projectConfig }),
    renderSavedView: (overrides) => React.createElement(SavedSetupView, {
      context: setupContext,
      initialConfig,
      projectConfig,
      overrides: overrides as SavedViewOverrides | undefined
    })
  };
  const result = await strategy(hookContext);
  return result ?? null;
}
