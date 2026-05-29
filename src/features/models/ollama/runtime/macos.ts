import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { runCommand } from "../../../../node/process.js";
import type { LocalModelInstallResult } from "../../types.js";
import {
  detectOllamaRuntime,
  resolveOllamaExecutable,
  runInteractiveInstallerCommand,
  runInstallerCommand,
  startOllamaServe,
  waitUntilOllamaReachable
} from "./common.js";
import type { OllamaRuntimeCallbacks, OllamaRuntimeManager, OllamaRuntimeState } from "./types.js";

export class MacOllamaRuntimeManager implements OllamaRuntimeManager {
  detect(): Promise<OllamaRuntimeState> {
    return detectOllamaRuntime();
  }

  async install(callbacks?: OllamaRuntimeCallbacks): Promise<LocalModelInstallResult> {
    const tempDir = mkdtempSync(path.join(tmpdir(), "pubwave-ollama-"));
    const scriptPath = path.join(tempDir, "install.sh");
    callbacks?.onInstallStarted?.();
    try {
      const download = await runInstallerCommand("curl", [
        "-fL",
        "--progress-bar",
        "-o",
        scriptPath,
        "https://ollama.com/install.sh"
      ], callbacks);
      if (!download.ok) return download;

      const install = runInteractiveInstallerCommand("sh", [scriptPath], { OLLAMA_NO_START: "1" });
      if (!install.ok) return install;

      return resolveOllamaExecutable()
        ? { ok: true, detail: "Ollama installed." }
        : { ok: false, detail: "Ollama installer completed, but the ollama command is not available yet. Restart the terminal, then retry." };
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  }

  async start(callbacks?: OllamaRuntimeCallbacks): Promise<LocalModelInstallResult> {
    if (existsSync("/Applications/Ollama.app")) {
      const launch = runCommand("open", ["-a", "Ollama"]);
      if (!launch.ok) {
        return {
          ok: false,
          detail: launch.stderr
            || launch.stdout
            || `Could not launch Ollama.app (exit ${launch.exitCode ?? "unknown"}).`
        };
      }
      return this.waitUntilReady();
    }

    const executable = resolveOllamaExecutable();
    if (!executable) {
      return { ok: false, detail: "Ollama is installed, but the ollama command was not found." };
    }
    return startOllamaServe(executable, callbacks);
  }

  waitUntilReady(timeoutMs?: number): Promise<LocalModelInstallResult> {
    return waitUntilOllamaReachable(timeoutMs);
  }
}
