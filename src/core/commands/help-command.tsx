import React from "react";
import { HelpView } from "../../ui/index.js";
import type { CliCommand } from "../types.js";

export function helpCommand(): CliCommand {
  return {
    name: "help",
    description: "Show available commands.",
    run: (context) => {
      const commands = (context._commands ?? [])
        .filter((command) => !command.hidden)
        .map((command) => ({
          name: command.name,
          commandText: `${context.app.command} ${command.name}`.trim(),
          description: command.description
        }));
      return <HelpView appName={context.app.name} commands={commands} />;
    }
  };
}
