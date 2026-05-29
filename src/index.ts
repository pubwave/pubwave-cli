export {
  createPubwaveCli,
  renderSetupWizard,
  renderSavedView,
  hasSavedSetupConfig
} from "./core/create-pubwave-cli.js";
export { jsonConfig, jsonConfigPath } from "./core/config/json-adapter.js";
export { managedJsonConfig, type ManagedJsonConfigOptions } from "./core/config/managed-json-adapter.js";
export { deepMergePartial } from "./core/config/merge.js";
export type {
  CliAppConfig,
  CliCommand,
  CliCommandContext,
  CliConfigAdapter,
  CliConfigFactory,
  CliConfigFactoryContext,
  CliConfigInput,
  CliFeatureConfig,
  CliPathContext,
  CreatePubwaveCliOptions,
  DefaultCommand,
  DefaultCommandContext,
  DefaultCommandHook,
  DefaultCommandStrategy,
  NormalizedAppConfig,
  NormalizedFeatureConfig,
  PubwaveCli,
  PubwaveCliConfig,
  SavedViewContext,
  SavedViewOverrides,
  SavedViewRow,
  SetupFeatureConfig
} from "./core/types.js";
export type {
  CustomSetupStep,
  CustomSetupStepWriteResult,
  SetupStepContext,
  SetupTextContext,
  StandardSetupStepId
} from "./features/setup/types.js";
export type {
  SetupStage,
  StageChoiceOption,
  StageInputRequest,
  StageResult,
  StageResultStatus,
  StageRunContext,
  StageRunContextConfig,
  StandardStageId
} from "./features/setup/stage-types.js";
export type {
  CountedHandle,
  IndeterminateHandle,
  ProgressColor,
  RichProgressApi,
  StatusCard
} from "./features/setup/progress-types.js";
export type {
  AiConfig,
  CloudModelProvider,
  LocalModelRuntime,
  ModelChoice,
  ModelSource
} from "./features/models/types.js";
export type {
  MobilePlatform,
  MobileRunInput,
  MobileRunResult
} from "./features/mobile/types.js";
export {
  localProjectDir,
  mobileWorkspaceContextFromCli,
  type MobileWorkspace,
  type MobileWorkspaceProvider,
  type MobileWorkspaceResolveContext
} from "./features/mobile/workspace.js";
export { defaultCloudModelProviders, defaultLocalModelChoices, defaultLanguages } from "./features/models/defaults/index.js";
export { resolveLocalModelServiceEnv } from "./features/models/ollama/service-env.js";
export {
  availableOllamaModelChoices,
  installedOllamaModels,
  isOllamaAvailable,
  isOllamaModelInstalled
} from "./features/models/ollama/availability.js";
export { installOllamaModel, uninstallOllamaModel } from "./features/models/ollama/install.js";
