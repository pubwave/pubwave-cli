export interface ParsedCommand {
  command: string;
  options: Record<string, string | boolean>;
}

export function parseCommand(argv: readonly string[]): ParsedCommand {
  const command: string[] = [];
  const options: Record<string, string | boolean> = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token) {
      continue;
    }

    if (token.startsWith("--")) {
      const [rawKey, rawValue] = token.slice(2).split("=");
      const key = rawKey ?? "";
      if (!key) {
        continue;
      }

      if (rawValue !== undefined) {
        options[key] = rawValue;
        continue;
      }

      const nextToken = argv[index + 1];
      if (nextToken && !nextToken.startsWith("--")) {
        options[key] = nextToken;
        index += 1;
        continue;
      }

      options[key] = true;
      continue;
    }

    command.push(token);
  }

  return {
    command: command.join(" "),
    options
  };
}
