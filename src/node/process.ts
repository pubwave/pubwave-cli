import { spawn, spawnSync } from "node:child_process";

export interface CommandResult {
  ok: boolean;
  exitCode: number | null;
  stdout: string;
  stderr: string;
}

export interface AsyncCommandHandlers {
  onStdout?: (chunk: string) => void;
  onStderr?: (chunk: string) => void;
  inheritStdin?: boolean;
  stdinData?: string;
}

export function runCommand(command: string, args: string[], cwd = process.cwd()): CommandResult {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    env: process.env
  });

  return {
    ok: result.status === 0 && !result.error,
    exitCode: result.status,
    stdout: result.stdout?.trim() ?? "",
    stderr: result.error?.message ?? result.stderr?.trim() ?? ""
  };
}

export async function runCommandAsync(
  command: string,
  args: string[],
  cwd = process.cwd(),
  handlers?: AsyncCommandHandlers
): Promise<CommandResult> {
  return await new Promise<CommandResult>((resolve) => {
    const stdinMode = handlers?.inheritStdin ? "inherit" : "pipe";
    const child = spawn(command, args, {
      cwd,
      env: process.env,
      stdio: [stdinMode, "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    if (handlers?.stdinData !== undefined) {
      child.stdin?.write(handlers.stdinData + "\n");
      child.stdin?.end();
    }

    child.stdout?.on("data", (chunk) => {
      const text = String(chunk);
      stdout += text;
      handlers?.onStdout?.(text);
    });

    child.stderr?.on("data", (chunk) => {
      const text = String(chunk);
      stderr += text;
      handlers?.onStderr?.(text);
    });

    child.on("error", (error) => {
      resolve({
        ok: false,
        exitCode: null,
        stdout: stdout.trim(),
        stderr: error.message || stderr.trim()
      });
    });

    child.on("close", (code) => {
      resolve({
        ok: code === 0,
        exitCode: code,
        stdout: stdout.trim(),
        stderr: stderr.trim()
      });
    });
  });
}

export function runInteractiveCommand(command: string, args: string[], cwd = process.cwd()): CommandResult {
  const result = spawnSync(command, args, {
    cwd,
    env: process.env,
    stdio: "inherit"
  });

  return {
    ok: result.status === 0 && !result.error,
    exitCode: result.status,
    stdout: "",
    stderr: result.error?.message ?? ""
  };
}
