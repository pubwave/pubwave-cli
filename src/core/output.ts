export function formatKeyValue(title: string, values: Record<string, unknown>): string {
  const lines = [title];
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) {
      lines.push(`${key}: ${String(value)}`);
    }
  }
  return lines.join("\n");
}

export function formatUnknownCommand(command: string, appCommand: string): string {
  return command
    ? `Unknown command: ${command}\nRun \`${appCommand} help\` for available commands.`
    : `Run \`${appCommand} help\` for available commands.`;
}
