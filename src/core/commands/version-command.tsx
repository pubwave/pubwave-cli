import React from "react";
import { MessageView } from "../../ui/index.js";
import type { CliCommand } from "../types.js";

export function versionCommand(): CliCommand {
  return {
    name: "version",
    description: "Show CLI version.",
    run: (context) => <MessageView title={context.app.name} message={context.app.version} />
  };
}
