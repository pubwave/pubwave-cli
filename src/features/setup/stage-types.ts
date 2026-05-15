import type {
  CliPathContext,
  NormalizedAppConfig,
  NormalizedFeatureConfig,
  PubwaveCliConfig
} from "../../core/types.js";
import type { WizardLocale } from "../../shared/i18n/wizard/index.js";
import type { RichProgressApi } from "./progress-types.js";

export type StandardStageId =
  | "prepare-local-model"
  | "save-config"
  | "mobile-install";

export interface StageRunContextConfig<TProjectConfig> {
  loadProjectConfig(): Promise<TProjectConfig>;
  saveProjectConfig(next: TProjectConfig): Promise<void>;
  reloadCliConfig(): Promise<PubwaveCliConfig>;
  mergeCliConfig(cliConfig: PubwaveCliConfig, baseProjectConfig: TProjectConfig): Promise<TProjectConfig>;
}

export interface StageRunContext<TProjectConfig = PubwaveCliConfig> {
  projectConfig: TProjectConfig;
  cliConfig: PubwaveCliConfig;
  paths: CliPathContext;
  app: NormalizedAppConfig;
  features: NormalizedFeatureConfig<TProjectConfig>;
  locale: WizardLocale;
  progress: RichProgressApi;
  config: StageRunContextConfig<TProjectConfig>;
  abortSignal: AbortSignal;
}

export type StageResultStatus = "ok" | "failed" | "skipped" | "needs-input";

export interface StageChoiceOption {
  label: string;
  value: string;
  description?: string;
}

export type StageInputRequest =
  | {
      kind: "choice";
      id: string;
      title: string;
      choices: StageChoiceOption[];
      multi?: boolean;
      resume: (value: string | string[]) => Promise<StageResult | void>;
    }
  | {
      kind: "confirm";
      id: string;
      title: string;
      message?: string;
      resume: (confirmed: boolean) => Promise<StageResult | void>;
    };

export interface StageResult {
  status: StageResultStatus;
  completedText?: string;
  detail?: string;
  input?: StageInputRequest;
}

export interface SetupStage<TProjectConfig = PubwaveCliConfig> {
  id: string;
  insertBefore?: StandardStageId;
  insertAfter?: StandardStageId;
  title: string | ((ctx: StageRunContext<TProjectConfig>) => string);
  skip?: (ctx: StageRunContext<TProjectConfig>) => boolean | Promise<boolean>;
  run: (ctx: StageRunContext<TProjectConfig>) => Promise<StageResult | void>;
  continueOnError?: boolean;
}
