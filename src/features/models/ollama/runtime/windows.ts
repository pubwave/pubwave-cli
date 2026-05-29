import { existsSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import type { LocalModelInstallResult } from "../../types.js";
import {
  detectOllamaRuntime,
  resolveOllamaExecutable,
  runInstallerCommand,
  startOllamaServe,
  waitUntilOllamaReachable
} from "./common.js";
import type { OllamaRuntimeCallbacks, OllamaRuntimeManager, OllamaRuntimeState } from "./types.js";

export class WindowsOllamaRuntimeManager implements OllamaRuntimeManager {
  detect(): Promise<OllamaRuntimeState> {
    return detectOllamaRuntime();
  }

  async install(callbacks?: OllamaRuntimeCallbacks): Promise<LocalModelInstallResult> {
    callbacks?.onInstallStarted?.();
    const result = await runInstallerCommand("powershell.exe", [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      "irm https://ollama.com/install.ps1 | iex"
    ], callbacks);
    if (!result.ok) return result;

    return resolveOllamaExecutable()
      ? { ok: true, detail: "Ollama installed." }
      : { ok: false, detail: "Ollama installer completed, but ollama.exe was not found in the expected user install directory." };
  }

  async start(callbacks?: OllamaRuntimeCallbacks): Promise<LocalModelInstallResult> {
    if (await waitUntilOllamaReachable(1_500).then((result) => result.ok)) {
      return { ok: true, detail: "Ollama runtime is ready." };
    }

    const app = resolveOllamaAppExecutable();
    if (app) {
      let spawnError: string | null = null;
      const child = spawn(app, [], {
        detached: true,
        stdio: "ignore",
        windowsHide: true
      });
      child.on("error", (err) => { spawnError = err.message; });
      child.unref();
      // Surface a launch failure immediately instead of waiting out the full
      // reachability timeout when the app couldn't start at all.
      return waitUntilOllamaReachable(undefined, async () => spawnError
        ? { ok: false, detail: `Could not launch Ollama: ${spawnError}` }
        : null);
    }

    const executable = resolveOllamaExecutable();
    if (!executable) {
      return { ok: false, detail: "Ollama is installed, but ollama.exe was not found." };
    }
    return startOllamaServe(executable, callbacks);
  }

  waitUntilReady(timeoutMs?: number): Promise<LocalModelInstallResult> {
    return waitUntilOllamaReachable(timeoutMs);
  }
}

function resolveOllamaAppExecutable(): string | null {
  const candidates = [
    process.env.LOCALAPPDATA
      ? path.join(process.env.LOCALAPPDATA, "Programs", "Ollama", "ollama app.exe")
      : null
  ].filter((candidate): candidate is string => !!candidate);

  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}
