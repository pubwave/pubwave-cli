export type ModelSource = "cloud" | "local";

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
}

export type LocalModelInstallProgressStage =
  | "check-runtime"
  | "install-runtime"
  | "start-runtime"
  | "check-model"
  | "pull-model"
  | "verify-model";
