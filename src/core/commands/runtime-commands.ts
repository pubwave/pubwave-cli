import type { CliCommand } from "../types.js";

export function runtimeCommands(): CliCommand[] {
  return [
    {
      name: "launch",
      description: "Launch the project runtime.",
      run: async (context, options) => context.features.runtime?.launch
        ? context.features.runtime.launch(context, options)
        : "Runtime launch is not configured for this CLI."
    },
    {
      name: "status",
      description: "Show runtime status.",
      run: async (context, options) => context.features.runtime?.status
        ? context.features.runtime.status(context, options)
        : "Runtime status is not configured for this CLI."
    },
    {
      name: "down",
      description: "Stop the project runtime.",
      run: async (context, options) => context.features.runtime?.stop
        ? context.features.runtime.stop(context, options)
        : "Runtime stop is not configured for this CLI."
    },
    {
      name: "logs",
      description: "Show runtime logs.",
      run: async (context, options) => context.features.runtime?.logs
        ? context.features.runtime.logs(context, options)
        : "Runtime logs are not configured for this CLI."
    }
  ];
}
