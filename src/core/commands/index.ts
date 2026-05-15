import type { CliCommand } from "../types.js";
import { configGetCommand, configSetCommand } from "./config-commands.js";
import { helpCommand } from "./help-command.js";
import { mobileCommands } from "./mobile-commands.js";
import { modelCommands } from "./model-commands.js";
import { runtimeCommands } from "./runtime-commands.js";
import { setupCommand } from "./setup-command.js";
import { versionCommand } from "./version-command.js";

export function builtInCommands(): CliCommand[] {
  return [
    helpCommand(),
    versionCommand(),
    configGetCommand(),
    configSetCommand(),
    setupCommand(),
    ...modelCommands(),
    ...mobileCommands(),
    ...runtimeCommands()
  ];
}
