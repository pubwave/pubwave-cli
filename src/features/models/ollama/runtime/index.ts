import { LinuxOllamaRuntimeManager } from "./linux.js";
import { MacOllamaRuntimeManager } from "./macos.js";
import type { OllamaRuntimeManager } from "./types.js";
import { WindowsOllamaRuntimeManager } from "./windows.js";

export function createOllamaRuntimeManager(): OllamaRuntimeManager | null {
  switch (process.platform) {
    case "darwin":
      return new MacOllamaRuntimeManager();
    case "linux":
      return new LinuxOllamaRuntimeManager();
    case "win32":
      return new WindowsOllamaRuntimeManager();
    default:
      return null;
  }
}

export type {
  OllamaRuntimeCallbacks,
  OllamaRuntimeManager,
  OllamaRuntimeState
} from "./types.js";
export {
  resolveOllamaExecutable,
  runOllamaCommand
} from "./common.js";
