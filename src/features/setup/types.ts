import type { NormalizedAppConfig, PubwaveCliConfig } from "../../core/types.js";
import type { WizardLocale } from "../../shared/i18n/wizard/index.js";
import type { ModelChoice } from "../models/types.js";
import type { MobileInstallableDevice } from "../mobile/types.js";

export type SetupPhase =
  | "setup"
  | "localModelInstalling"
  | "saving"
  | "mobileInstalling"
  | "mobileDeviceChoice"
  | "mobileRetry"
  | "pipeline"
  | "done"
  | "error";

export type SetupValueKey =
  | "language"
  | "modelSource"
  | "provider"
  | "model"
  | "apiKey"
  | "mobileInstall";

export type StandardSetupStepId = SetupValueKey;

export const STANDARD_SETUP_STEP_IDS: readonly StandardSetupStepId[] = [
  "language",
  "modelSource",
  "provider",
  "model",
  "apiKey",
  "mobileInstall"
];

export function isStandardSetupStepId(id: string): id is StandardSetupStepId {
  return (STANDARD_SETUP_STEP_IDS as readonly string[]).includes(id);
}

export interface SetupChoiceGroup {
  id: "installed" | "recommended" | "more";
  choices: ModelChoice[];
}

export interface SetupStep {
  id: string;
  title: string;
  hint: string;
  kind?: "choice" | "input";
  choices: ModelChoice[];
  choiceGroups?: SetupChoiceGroup[];
  inputMask?: boolean;
  description?: string;
  inputValueKey?: "model" | "apiKey";
  isCustom?: boolean;
}

export interface SetupState {
  language: string;
  modelSource: "cloud" | "local";
  provider: string;
  model: string;
  cloudModelInputMode: boolean;
  apiKey: string;
  mobileInstall: "skip" | "install";
  customValues: Record<string, unknown>;
}

export interface SetupTextContext {
  locale: WizardLocale;
  app: NormalizedAppConfig;
}

export interface SetupStepContext<TProjectConfig = PubwaveCliConfig> extends SetupTextContext {
  projectConfig: TProjectConfig;
  cliConfig: PubwaveCliConfig;
}

export interface CustomSetupStepWriteResult<TProjectConfig> {
  projectConfig: TProjectConfig;
  cliConfig?: PubwaveCliConfig;
}

export interface CustomSetupStep<TProjectConfig = PubwaveCliConfig> {
  id: string;
  insertBefore?: StandardSetupStepId;
  insertAfter?: StandardSetupStepId;
  kind: "choice" | "input";
  title: string | ((ctx: SetupTextContext) => string);
  hint?: string | ((ctx: SetupTextContext) => string);
  description?: string | ((ctx: SetupTextContext) => string);
  choices?: ModelChoice[] | ((ctx: SetupStepContext<TProjectConfig>) => ModelChoice[]);
  inputMask?: boolean;
  inputDefault?: string | ((ctx: SetupStepContext<TProjectConfig>) => string);
  read(projectConfig: TProjectConfig, cliConfig: PubwaveCliConfig): string;
  write(
    projectConfig: TProjectConfig,
    value: string,
    cliConfig: PubwaveCliConfig
  ): Promise<CustomSetupStepWriteResult<TProjectConfig>>;
}

export interface VisibleChoiceWindow<T> {
  items: T[];
  startIndex: number;
  hasHiddenAbove: boolean;
  hasHiddenBelow: boolean;
}

export interface ProgressLine {
  text: string;
  color?: "cyan" | "cyanBright" | "yellow" | "green" | "red" | "gray";
  completedText?: string;
}

export interface DeviceInstallState {
  deviceId: string;
  label: string;
  status: "installing" | "completed" | "failed";
  outputLines: ProgressLine[];
  detail?: string;
}

export interface MobileDeviceChoiceState {
  devices: MobileInstallableDevice[];
  selectedDeviceIds: string[];
}

export const MAX_OUTPUT_LINES = 120;
