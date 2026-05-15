import { spawn } from "node:child_process";
import { runCommand, runCommandAsync, runInteractiveCommand } from "../../../node/process.js";
import type { LocalModelInstallProgressStage, LocalModelInstallResult } from "../types.js";
import { isOllamaAvailable, isOllamaModelInstalled } from "./availability.js";
import { delay, installCommandForPlatform } from "./platform.js";
import { verifyOllamaModelReady } from "./verify.js";

export async function installOllamaModel(
  model: string,
  onProgress?: (stage: LocalModelInstallProgressStage, model: string) => void,
  onOutput?: (line: string, stream: "stdout" | "stderr") => void,
  options?: { autoInstallRuntime?: boolean; autoStartRuntime?: boolean }
): Promise<LocalModelInstallResult> {
  onProgress?.("check-runtime", model);
  if (!isOllamaAvailable()) {
    if (!options?.autoInstallRuntime) {
      return {
        ok: false,
        detail: "Ollama is not installed or is not available on PATH. Install Ollama, then retry."
      };
    }

    onProgress?.("install-runtime", model);
    const installResult = installOllamaRuntime();
    if (!installResult.ok) {
      return installResult;
    }
  }

  if (options?.autoStartRuntime !== false) {
    onProgress?.("start-runtime", model);
    const runtimeResult = await ensureOllamaRuntimeStarted();
    if (!runtimeResult.ok) {
      return runtimeResult;
    }
  }

  onProgress?.("check-model", model);
  if (isOllamaModelInstalled(model)) {
    return {
      ok: true,
      detail: `${model} is already installed in Ollama.`
    };
  }

  onProgress?.("pull-model", model);
  const result = await runCommandAsync("ollama", ["pull", model], undefined, {
    onStdout: (chunk) => onOutput?.(chunk, "stdout"),
    onStderr: (chunk) => onOutput?.(chunk, "stderr")
  });

  if (!result.ok) {
    return {
      ok: false,
      detail: result.stderr || result.stdout || `Failed to install ${model}.`
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

export function installOllamaRuntime(): LocalModelInstallResult {
  const installCommand = installCommandForPlatform();
  if (!installCommand) {
    return {
      ok: false,
      detail: `Automatic Ollama install is not supported on ${process.platform}.`
    };
  }

  const result = process.stdin.isTTY && process.stdout.isTTY
    ? runInteractiveCommand(installCommand.command, installCommand.args)
    : runCommand(installCommand.command, installCommand.args);

  if (!result.ok) {
    return {
      ok: false,
      detail: result.stderr || result.stdout || "Automatic Ollama install failed."
    };
  }

  return isOllamaAvailable()
    ? { ok: true, detail: "Ollama installed." }
    : { ok: false, detail: "Ollama installer completed, but ollama is not available on PATH yet. Restart the terminal, then retry." };
}

export async function ensureOllamaRuntimeStarted(): Promise<LocalModelInstallResult> {
  const probe = await runCommandAsync("ollama", ["list"]);
  if (probe.ok) {
    return {
      ok: true,
      detail: "Ollama runtime is ready."
    };
  }

  const child = spawn("ollama", ["serve"], {
    detached: true,
    stdio: "ignore",
    env: process.env
  });
  child.unref();

  for (let attempt = 0; attempt < 20; attempt += 1) {
    await delay(300);
    const retry = await runCommandAsync("ollama", ["list"]);
    if (retry.ok) {
      return {
        ok: true,
        detail: "Ollama runtime started."
      };
    }
  }

  return {
    ok: false,
    detail: "Ollama is installed, but the local runtime did not become ready."
  };
}

export function uninstallOllamaModel(model: string): LocalModelInstallResult {
  if (!isOllamaAvailable()) {
    return {
      ok: false,
      detail: "Ollama is not installed or is not available on PATH."
    };
  }

  const result = runCommand("ollama", ["rm", model]);
  return {
    ok: result.ok,
    detail: result.ok ? `${model} removed.` : (result.stderr || result.stdout || `Failed to remove ${model}.`)
  };
}
