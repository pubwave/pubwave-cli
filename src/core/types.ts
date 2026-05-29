import type { CloudModelProvider, LocalModelRuntime, ModelChoice } from "../features/models/types.js";
import type { MobileFeatureConfig } from "../features/mobile/types.js";
import type { CustomSetupStep, SetupState } from "../features/setup/types.js";
import type { SetupStage } from "../features/setup/stage-types.js";
import type React from "react";

export interface CliAppConfig {
  name: string;
  command: string;
  homeDirName?: string;
  envPrefix?: string;
  version?: string;
  workspaceMarkers?: string[];
}

export type NormalizedAppConfig = Required<CliAppConfig>;

export interface PubwaveCliConfig {
  language?: string;
  ai?: {
    modelSource?: "cloud" | "local";
    provider?: string;
    model?: string;
    apiKey?: string;
  };
  mobile?: {
    enabled?: boolean;
    platform?: "ios" | "android";
  };
  [key: string]: unknown;
}

export interface CliConfigAdapter<TProjectConfig = PubwaveCliConfig> {
  load(): Promise<TProjectConfig>;
  save(config: TProjectConfig): Promise<void>;
  toCliConfig?: (projectConfig: TProjectConfig) => PubwaveCliConfig | Promise<PubwaveCliConfig>;
  fromCliConfig?: (
    cliConfig: PubwaveCliConfig,
    currentProjectConfig: TProjectConfig
  ) => TProjectConfig | Promise<TProjectConfig>;
}

export interface CliConfigFactoryContext {
  app: Required<CliAppConfig>;
  paths: CliPathContext;
}

export type CliConfigFactory<TProjectConfig = PubwaveCliConfig> = (
  context: CliConfigFactoryContext
) => CliConfigAdapter<TProjectConfig>;

export type CliConfigInput<TProjectConfig = PubwaveCliConfig> =
  | CliConfigAdapter<TProjectConfig>
  | CliConfigFactory<TProjectConfig>;

export interface SetupFeatureConfig<TProjectConfig = PubwaveCliConfig> {
  enabled?: boolean;
  languages?: ModelChoice[];
  customSteps?: CustomSetupStep<TProjectConfig>[];
  stages?: SetupStage<TProjectConfig>[];
  shouldRequireAiSetup?: (ctx: SetupRequirementContext<TProjectConfig>) => boolean;
  /**
   * Extra rows shown in the config summary, used by BOTH the saved view and the
   * post-setup completion screen, so a host app declares its full config once
   * and both screens stay identical. Same shape as the saved view's
   * `additionalRows` (which, when provided, overrides this for the saved view).
   */
  configRows?: SavedViewRow[] | ((ctx: SavedViewContext<TProjectConfig>) => SavedViewRow[]);
}

export interface SetupRequirementContext<TProjectConfig = PubwaveCliConfig> {
  state: SetupState;
  projectConfig: TProjectConfig;
  cliConfig: PubwaveCliConfig;
}

export interface CloudModelFeatureConfig {
  enabled?: boolean;
  providers?: CloudModelProvider[] | string[];
}

export interface LocalModelFeatureConfig {
  enabled?: boolean;
  choices?: ModelChoice[];
  runtime?: LocalModelRuntime;
  autoInstallRuntime?: boolean;
  autoStartRuntime?: boolean;
}

export interface RuntimeFeatureConfig {
  launch?: (context: CliCommandContext, options: Record<string, string | boolean>) => Promise<unknown>;
  status?: (context: CliCommandContext, options: Record<string, string | boolean>) => Promise<unknown>;
  stop?: (context: CliCommandContext, options: Record<string, string | boolean>) => Promise<unknown>;
  logs?: (context: CliCommandContext, options: Record<string, string | boolean>) => Promise<unknown>;
}

export interface CliFeatureConfig<TProjectConfig = PubwaveCliConfig> {
  setup?: boolean | SetupFeatureConfig<TProjectConfig>;
  cloudModel?: boolean | CloudModelFeatureConfig;
  localModel?: boolean | LocalModelFeatureConfig;
  mobile?: boolean | MobileFeatureConfig;
  runtime?: RuntimeFeatureConfig;
}

export interface CliCommandContext<TProjectConfig = PubwaveCliConfig> {
  app: NormalizedAppConfig;
  features: NormalizedFeatureConfig<TProjectConfig>;
  paths: CliPathContext;
  config: {
    loadProjectConfig(): Promise<TProjectConfig>;
    loadCliConfig(): Promise<PubwaveCliConfig>;
    saveCliConfig(config: PubwaveCliConfig): Promise<void>;
    saveProjectConfig(next: TProjectConfig): Promise<void>;
    mergeCliConfig(cliConfig: PubwaveCliConfig, baseProjectConfig: TProjectConfig): Promise<TProjectConfig>;
    updateCliConfig(updater: (current: PubwaveCliConfig) => PubwaveCliConfig): Promise<PubwaveCliConfig>;
  };
  write(message: string): void;
  // Internal: full command list, populated by createPubwaveCli for the help command.
  _commands?: readonly CliCommand<TProjectConfig>[];
}

export interface CliPathContext {
  projectRoot: string | null;
  appHome: string;
  runtimeRoot: string;
}

export interface CliCommand<TProjectConfig = PubwaveCliConfig> {
  name: string;
  description: string;
  options?: readonly string[];
  hidden?: boolean;
  run(
    context: CliCommandContext<TProjectConfig>,
    options: Record<string, string | boolean>
  ): Promise<CliCommandResult> | CliCommandResult;
}

export type CliCommandResult = string | void | unknown | React.ReactElement;

export type DefaultCommandStrategy = "setup-or-saved-view" | "setup-only";

export interface DefaultCommandContext<TProjectConfig = PubwaveCliConfig> {
  context: CliCommandContext<TProjectConfig>;
  initialConfig: PubwaveCliConfig;
  hasSavedSetupConfig: boolean;
  renderSetupWizard(): React.ReactElement;
  renderSavedView(overrides?: SavedViewOverrides<TProjectConfig>): React.ReactElement;
}

export type DefaultCommandHook<TProjectConfig = PubwaveCliConfig> = (
  ctx: DefaultCommandContext<TProjectConfig>
) => Promise<React.ReactElement | void> | React.ReactElement | void;

export type DefaultCommand<TProjectConfig = PubwaveCliConfig> =
  | DefaultCommandStrategy
  | DefaultCommandHook<TProjectConfig>;

export interface SavedViewRow {
  label: string;
  value?: unknown;
}

export interface SavedViewContext<TProjectConfig = PubwaveCliConfig> {
  context: CliCommandContext<TProjectConfig>;
  initialConfig: PubwaveCliConfig;
  projectConfig: TProjectConfig;
}

export interface SavedViewOverrides<TProjectConfig = PubwaveCliConfig> {
  additionalRows?: SavedViewRow[] | ((ctx: SavedViewContext<TProjectConfig>) => SavedViewRow[]);
  onContinue?: (ctx: SavedViewContext<TProjectConfig>) => Promise<React.ReactElement | void> | React.ReactElement | void;
}

export interface CreatePubwaveCliOptions<TProjectConfig = PubwaveCliConfig> {
  app: CliAppConfig;
  config: CliConfigInput<TProjectConfig>;
  features?: CliFeatureConfig<TProjectConfig>;
  commands?: CliCommand<TProjectConfig>[];
  defaultCommand?: DefaultCommand<TProjectConfig>;
}

export interface NormalizedFeatureConfig<TProjectConfig = PubwaveCliConfig> {
  setup: {
    enabled: boolean;
    languages: ModelChoice[];
    customSteps: CustomSetupStep<TProjectConfig>[];
    stages: SetupStage<TProjectConfig>[];
    shouldRequireAiSetup: (ctx: SetupRequirementContext<TProjectConfig>) => boolean;
    configRows: SavedViewRow[] | ((ctx: SavedViewContext<TProjectConfig>) => SavedViewRow[]);
  };
  cloudModel: {
    enabled: boolean;
    providers: CloudModelProvider[];
  };
  localModel: {
    enabled: boolean;
    choices: ModelChoice[];
    runtime: LocalModelRuntime;
    autoInstallRuntime: boolean;
    autoStartRuntime: boolean;
  };
  mobile: MobileFeatureConfig | false;
  runtime?: RuntimeFeatureConfig;
}

export interface PubwaveCli<TProjectConfig = PubwaveCliConfig> {
  run(argv?: string[]): Promise<void>;
  listCommands(): readonly CliCommand<TProjectConfig>[];
}
