import { runCommand, runCommandAsync } from "../../../node/process.js";
import type { LocalModelInstallProgressStage, LocalModelInstallResult } from "../types.js";
import { isOllamaAvailable, isOllamaModelInstalledAsync } from "./availability.js";
import { createOllamaRuntimeManager, resolveOllamaExecutable } from "./runtime/index.js";
import { verifyOllamaModelReady } from "./verify.js";

export async function installOllamaModel(
  model: string,
  onProgress?: (stage: LocalModelInstallProgressStage, model: string) => void,
  onOutput?: (line: string, stream: "stdout" | "stderr") => void,
  options?: {
    autoInstallRuntime?: boolean;
    autoStartRuntime?: boolean;
    locale?: string;
  }
): Promise<LocalModelInstallResult> {
  onProgress?.("check-runtime", model);
  const manager = createOllamaRuntimeManager();
  if (!manager) {
    return {
      ok: false,
      detail: `Automatic Ollama setup is not supported on ${process.platform}.`
    };
  }

  let runtime = await manager.detect();
  if (!runtime.installed) {
    if (!options?.autoInstallRuntime) {
      return {
        ok: false,
        detail: "Ollama is not installed or is not available on PATH. Install Ollama, then retry."
      };
    }

    const installResult = await manager.install({
      onOutput,
      onInstallStarted: () => onProgress?.("install-runtime", model)
    });
    if (!installResult.ok) {
      return installResult;
    }
    runtime = await manager.detect();
  }

  if (options?.autoStartRuntime !== false) {
    onProgress?.("start-runtime", model);
    if (!runtime.reachable) {
      const startResult = await manager.start({
        onOutput
      });
      if (!startResult.ok) {
        return startResult;
      }
    }
    onProgress?.("wait-runtime", model);
    const readyResult = await manager.waitUntilReady();
    if (!readyResult.ok) return readyResult;
  }

  onProgress?.("check-model", model);
  if (await isOllamaModelInstalledAsync(model)) {
    return {
      ok: true,
      detail: `${model} is already installed in Ollama.`
    };
  }

  onProgress?.("pull-model", model);
  const executable = resolveOllamaExecutable();
  if (!executable) {
    return {
      ok: false,
      detail: "Ollama is installed, but the ollama command is not available yet. Restart the terminal, then retry."
    };
  }

  const result = await runCommandAsync(executable, ["pull", model], undefined, {
    onStdout: (chunk) => onOutput?.(chunk, "stdout"),
    onStderr: (chunk) => onOutput?.(chunk, "stderr")
  });

  if (!result.ok) {
    const detail = extractOllamaPullFailureDetail(result.stderr || result.stdout);
    return {
      ok: false,
      detail: detail || `Failed to install ${model}.`
    };
  }

  onProgress?.("verify-model", model);
  const verifyResult = await verifyOllamaModelReady(model);
  if (!verifyResult.ok) {
    return {
      ok: false,
      detail: `Installed ${model}, but verification failed: ${verifyResult.detail}`
    };
  }

  return {
    ok: true,
    detail: `${model} installed and verified.`
  };
}

function extractOllamaPullFailureDetail(rawText: string): string {
  const normalized = rawText
    .replace(/\u001B\[[0-9;?]*G/g, " ")
    .replace(/\u001B\[[0-9;?]*K/g, " ")
    .replace(/\[[0-9;?]*[ -/]*[@-~]/g, " ")
    .replace(/[\u2800-\u28ff]/g, " ")
    .replace(/\r\n|\n|\r/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const errorIndex = normalized.search(/\berror:/i);
  if (errorIndex >= 0) {
    return normalized.slice(errorIndex).trim();
  }

  const lines = rawText
    .replace(/\u001B\[[0-9;?]*G/g, "\r")
    .replace(/\u001B\[[0-9;?]*K/g, "")
    .replace(/\[[0-9;?]*[ -/]*[@-~]/g, "")
    .split(/\r\n|\n|\r/g)
    .map((line) => line.replace(/[\u2800-\u28ff]/g, "").trim())
    .filter((line) => line.length > 0 && !line.toLowerCase().startsWith("pulling "));

  return lines.at(-1) ?? "";
}

export async function installOllamaRuntime(
  onOutput?: (line: string, stream: "stdout" | "stderr") => void
): Promise<LocalModelInstallResult> {
  const manager = createOllamaRuntimeManager();
  if (!manager) {
    return { ok: false, detail: `Automatic Ollama install is not supported on ${process.platform}.` };
  }
  return manager.install({ onOutput });
}

export async function ensureOllamaRuntimeStarted(
  onOutput?: (line: string) => void
): Promise<LocalModelInstallResult> {
  const manager = createOllamaRuntimeManager();
  if (!manager) {
    return { ok: false, detail: `Automatic Ollama start is not supported on ${process.platform}.` };
  }
  return manager.start({ onOutput: (line) => onOutput?.(line) });
}

export function uninstallOllamaModel(model: string): LocalModelInstallResult {
  if (!isOllamaAvailable()) {
    return {
      ok: false,
      detail: "Ollama is not installed or is not available on PATH."
    };
  }

  const executable = resolveOllamaExecutable();
  if (!executable) {
    return {
      ok: false,
      detail: "Ollama is not installed or is not available on PATH."
    };
  }

  const result = runCommand(executable, ["rm", model]);
  return {
    ok: result.ok,
    detail: result.ok ? `${model} removed.` : (result.stderr || result.stdout || `Failed to remove ${model}.`)
  };
}

// Async variant for the interactive wizard so the Ink event loop doesn't stall
// during `ollama rm`. The synchronous version above is kept for non-interactive
// CLI commands and the public API.
export async function uninstallOllamaModelAsync(model: string): Promise<LocalModelInstallResult> {
  const executable = resolveOllamaExecutable();
  if (!executable) {
    return {
      ok: false,
      detail: "Ollama is not installed or is not available on PATH."
    };
  }

  const result = await runCommandAsync(executable, ["rm", model]);
  return {
    ok: result.ok,
    detail: result.ok ? `${model} removed.` : (result.stderr || result.stdout || `Failed to remove ${model}.`)
  };
}
