export type ModelSource = "cloud" | "local";

export type LocalModelRuntime = "ollama";

export interface AiConfig {
  modelSource?: ModelSource;
  provider?: string;
  model?: string;
  apiKey?: string;
}

export interface ModelChoice {
  label: string;
  value: string;
  description?: string;
  group?: "installed" | "recommended" | "more";
}

export interface CloudModelProvider extends ModelChoice {
  models: ModelChoice[];
}

export interface LocalModelInstallResult {
  ok: boolean;
  detail: string;
  cancelled?: boolean;
}

export type LocalModelInstallProgressStage =
  | "check-runtime"
  | "install-runtime"
  | "start-runtime"
  | "wait-runtime"
  | "check-model"
  | "pull-model"
  | "verify-model";
