import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { runCommand, runCommandAsync } from "../../../../node/process.js";
import type { LocalModelInstallResult } from "../../types.js";
import type { OllamaRuntimeCallbacks, OllamaRuntimeState } from "./types.js";

export async function delay(milliseconds: number): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

export function resolveOllamaExecutable(): string | null {
  const command = process.platform === "win32" ? "where" : "sh";
  const args = process.platform === "win32" ? ["ollama"] : ["-lc", "command -v ollama"];
  const result = runCommand(command, args);
  if (result.ok && result.stdout) {
    return result.stdout.split(/\r?\n/)[0]?.trim() || "ollama";
  }

  if (process.platform !== "win32") {
    return null;
  }

  const candidates = [
    process.env.LOCALAPPDATA
      ? path.join(process.env.LOCALAPPDATA, "Programs", "Ollama", "ollama.exe")
      : null,
    process.env.LOCALAPPDATA
      ? path.join(process.env.LOCALAPPDATA, "Programs", "Ollama", "ollama app.exe")
      : null,
    process.env.ProgramFiles
      ? path.join(process.env.ProgramFiles, "Ollama", "ollama.exe")
      : null
  ].filter((candidate): candidate is string => !!candidate);

  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

export async function detectOllamaRuntime(): Promise<OllamaRuntimeState> {
  const executable = resolveOllamaExecutable();
  return {
    installed: executable !== null,
    executable,
    reachable: await isOllamaRuntimeReachable()
  };
}

export async function runOllamaCommand(
  args: string[],
  callbacks?: OllamaRuntimeCallbacks
): Promise<LocalModelInstallResult> {
  const executable = resolveOllamaExecutable();
  if (!executable) {
    return { ok: false, detail: "Ollama is not installed or is not available on PATH." };
  }

  const result = await runCommandAsync(executable, args, undefined, {
    onStdout: (chunk) => callbacks?.onOutput?.(chunk, "stdout"),
    onStderr: (chunk) => callbacks?.onOutput?.(chunk, "stderr")
  });

  return {
    ok: result.ok,
    detail: result.ok ? "Ollama command completed." : (result.stderr || result.stdout || "Ollama command failed.")
  };
}

export async function runInstallerCommand(
  command: string,
  args: string[],
  callbacks?: OllamaRuntimeCallbacks
): Promise<LocalModelInstallResult> {
  const result = await withRawModeDisabled(async () => {
    return await runCommandAsync(command, args, undefined, {
      inheritStdin: process.stdin.isTTY,
      onStdout: (chunk) => callbacks?.onOutput?.(chunk, "stdout"),
      onStderr: (chunk) => callbacks?.onOutput?.(chunk, "stderr")
    });
  });

  return {
    ok: result.ok,
    detail: result.ok ? "Ollama installed." : (result.stderr || result.stdout || "Automatic Ollama install failed.")
  };
}

export function runInteractiveInstallerCommand(
  command: string,
  args: string[],
  env?: Record<string, string>
): LocalModelInstallResult {
  const result = withRawModeDisabledSync(() => {
    clearTerminalScreen();
    try {
      return spawnSync(command, args, {
        env: { ...process.env, ...env },
        stdio: "inherit"
      });
    } finally {
      clearTerminalScreen();
    }
  });

  return {
    ok: result.status === 0 && !result.error,
    detail: result.status === 0 && !result.error
      ? "Ollama installed."
      : (result.error?.message || `Ollama installer exited with code ${result.status ?? "unknown"}.`)
  };
}

function clearTerminalScreen(): void {
  if (!process.stdout.isTTY) {
    return;
  }
  process.stdout.write("\x1b[2J\x1b[3J\x1b[H");
}

export async function startOllamaServe(
  executable: string,
  callbacks?: OllamaRuntimeCallbacks
): Promise<LocalModelInstallResult> {
  if (await isOllamaRuntimeReachable()) {
    await waitForOllamaIdentityKey();
    return { ok: true, detail: "Ollama runtime is ready." };
  }

  const child = spawn(executable, ["serve"], {
    detached: true,
    stdio: ["ignore", "ignore", "pipe"],
    env: {
      ...process.env,
      OLLAMA_HOST: process.env.OLLAMA_HOST ?? "0.0.0.0"
    }
  });

  child.stderr?.on("data", (chunk: Buffer) => {
    callbacks?.onOutput?.(chunk.toString(), "stderr");
  });

  let exitCode: number | null = null;
  let spawnError: string | null = null;
  child.on("exit", (code) => { exitCode = code ?? 1; });
  child.on("error", (err) => { spawnError = err.message; });

  const ready = await waitUntilOllamaReachable(60_000, async () => {
    if (spawnError !== null) {
      return { ok: false, detail: `Failed to start Ollama: ${spawnError}` };
    }
    if (exitCode !== null) {
      return { ok: false, detail: `Ollama server exited unexpectedly (code ${exitCode}).` };
    }
    return null;
  });

  if (!ready.ok) {
    child.kill();
    return ready;
  }

  child.unref();
  await waitForOllamaIdentityKey();
  return { ok: true, detail: "Ollama runtime is ready." };
}

export async function waitUntilOllamaReachable(
  timeoutMs = 60_000,
  interrupt?: () => Promise<LocalModelInstallResult | null>
): Promise<LocalModelInstallResult> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isOllamaRuntimeReachable()) {
      return { ok: true, detail: "Ollama runtime is ready." };
    }
    const interrupted = await interrupt?.();
    if (interrupted) return interrupted;
    await delay(300);
  }

  return { ok: false, detail: `Ollama server did not become ready within ${Math.round(timeoutMs / 1000)} seconds.` };
}

export async function isOllamaRuntimeReachable(): Promise<boolean> {
  try {
    const response = await fetch(`${resolveOllamaApiBase()}/api/version`, {
      signal: AbortSignal.timeout(1_500)
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function resolveOllamaApiBase(): string {
  const raw = process.env.OLLAMA_HOST?.trim();
  if (!raw) {
    return "http://127.0.0.1:11434";
  }
  const normalized = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `http://${raw}`;
  try {
    const url = new URL(normalized);
    return `${url.protocol}//${url.hostname}:${url.port || "11434"}`;
  } catch {
    return "http://127.0.0.1:11434";
  }
}

async function waitForOllamaIdentityKey(): Promise<void> {
  const ollamaHome = process.env.OLLAMA_HOME ?? path.join(homedir(), ".ollama");
  const keyPath = path.join(ollamaHome, "id_ed25519");
  const deadline = Date.now() + 30_000;
  while (!existsSync(keyPath) && Date.now() < deadline) {
    await delay(300);
  }
}

async function withRawModeDisabled<T>(run: () => Promise<T>): Promise<T> {
  const stdin = process.stdin as typeof process.stdin & {
    isRaw?: boolean;
    setRawMode?: (mode: boolean) => typeof process.stdin;
  };
  const restoreRawMode = process.stdin.isTTY
    && stdin.isRaw === true
    && typeof stdin.setRawMode === "function";

  if (!restoreRawMode) {
    return await run();
  }

  stdin.setRawMode?.(false);
  try {
    return await run();
  } finally {
    stdin.setRawMode?.(true);
  }
}

function withRawModeDisabledSync<T>(run: () => T): T {
  const stdin = process.stdin as typeof process.stdin & {
    isRaw?: boolean;
    setRawMode?: (mode: boolean) => typeof process.stdin;
  };
  const restoreRawMode = process.stdin.isTTY
    && stdin.isRaw === true
    && typeof stdin.setRawMode === "function";

  if (!restoreRawMode) {
    return run();
  }

  stdin.setRawMode?.(false);
  try {
    return run();
  } finally {
    stdin.setRawMode?.(true);
  }
}
