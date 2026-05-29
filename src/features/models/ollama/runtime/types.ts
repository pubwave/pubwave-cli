import type { LocalModelInstallResult } from "../../types.js";

export interface OllamaRuntimeState {
  installed: boolean;
  executable: string | null;
  reachable: boolean;
}

export interface OllamaRuntimeCallbacks {
  onOutput?: (line: string, stream: "stdout" | "stderr") => void;
  onInstallStarted?: () => void;
}

export interface OllamaRuntimeManager {
  detect(): Promise<OllamaRuntimeState>;
  install(callbacks?: OllamaRuntimeCallbacks): Promise<LocalModelInstallResult>;
  start(callbacks?: OllamaRuntimeCallbacks): Promise<LocalModelInstallResult>;
  waitUntilReady(timeoutMs?: number): Promise<LocalModelInstallResult>;
}
