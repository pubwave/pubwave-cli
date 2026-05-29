import type React from "react";
import { useRef } from "react";
import type { CliCommandContext, PubwaveCliConfig } from "../../../core/types.js";
import type { MobileInstallableDevice, MobileRunResult } from "../../mobile/types.js";
import { wizardMessage, type WizardLocale } from "../../../shared/i18n/wizard/index.js";
import { friendlySetupError, onlyHasIosTrustIssue, type MobileRetryGuideKind } from "../mobile/error-analysis.js";
import { ensureSetupLocalModel, runSetupMobileInstall } from "../installers/index.js";
import { stateToConfig } from "../state/state-to-config.js";
import { shouldRequireAiSetup } from "../state/steps.js";
import { runStagePipeline, type StageRunnerCallbacks } from "../stage-runner.js";
import type {
  SetupStage,
  StageInputRequest,
  StageResult,
  StageRunContext
} from "../stage-types.js";
import type {
  CustomSetupStep,
  MobileDeviceChoiceState,
  SetupPhase,
  SetupState
} from "../types.js";
import type { SetupProgressState } from "./use-progress-state.js";

interface UseWizardSaveInput {
  context: CliCommandContext;
  initialConfig: PubwaveCliConfig;
  projectConfig: unknown;
  state: SetupState;
  setState: React.Dispatch<React.SetStateAction<SetupState>>;
  // Receives the merged project config once it has been persisted, so the
  // completion view can show the values the wizard just wrote (not the
  // pre-wizard project config).
  setSavedProjectConfig: React.Dispatch<React.SetStateAction<unknown>>;
  locale: WizardLocale;
  progress: SetupProgressState;
  setPhase: React.Dispatch<React.SetStateAction<SetupPhase>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setMobileResult: React.Dispatch<React.SetStateAction<MobileRunResult | null>>;
  setMobileNotice: React.Dispatch<React.SetStateAction<MobileRetryGuideKind | null>>;
  setMobileDeviceChoiceState: React.Dispatch<React.SetStateAction<MobileDeviceChoiceState | null>>;
  setMobileDeviceCursorIndex: React.Dispatch<React.SetStateAction<number>>;
  setCurrentStageId: React.Dispatch<React.SetStateAction<string | null>>;
  refreshLocalModelChoices: () => void;
  exit: () => void;
  onPipelineRendered: React.MutableRefObject<(() => void) | null>;
}

interface UseWizardSaveResult {
  prepareLocalModel: () => Promise<boolean>;
  saveAndExit: (override?: Partial<SetupState>) => Promise<void>;
  retryMobileInstall: () => Promise<void>;
  skipMobileInstallAndContinue: () => Promise<void>;
  mobileDeviceSelectionResolver: React.MutableRefObject<((selectedDeviceIds: string[]) => void) | null>;
}

export function useWizardSave(input: UseWizardSaveInput): UseWizardSaveResult {
  const mobileDeviceSelectionResolver = useRef<((selectedDeviceIds: string[]) => void) | null>(null);
  const preparedLocalModelKey = useRef<string | null>(null);

  function selectDevices(devices: MobileInstallableDevice[]): Promise<string[]> {
    input.setMobileDeviceChoiceState({
      devices,
      selectedDeviceIds: devices.map((device) => device.id)
    });
    input.setMobileDeviceCursorIndex(0);
    input.setPhase("mobileDeviceChoice");
    return new Promise<string[]>((resolve) => {
      mobileDeviceSelectionResolver.current = (deviceIds) => {
        input.setPhase("pipeline");
        resolve(deviceIds);
      };
    });
  }

  function buildStageContext<TProjectConfig>(
    effectiveState: SetupState,
    abortSignal: AbortSignal
  ): StageRunContext<TProjectConfig> {
    void effectiveState;
    return {
      projectConfig: input.projectConfig as TProjectConfig,
      cliConfig: input.initialConfig,
      paths: input.context.paths,
      app: input.context.app,
      features: input.context.features as unknown as StageRunContext<TProjectConfig>["features"],
      locale: input.locale,
      progress: input.progress,
      config: {
        loadProjectConfig: () => input.context.config.loadProjectConfig() as unknown as Promise<TProjectConfig>,
        saveProjectConfig: (next) => input.context.config.saveProjectConfig(next as unknown as never),
        reloadCliConfig: () => input.context.config.loadCliConfig(),
        mergeCliConfig: async (cliConfig, base) =>
          (await input.context.config.mergeCliConfig(cliConfig, base as unknown as never)) as TProjectConfig
      },
      abortSignal
    };
  }

  function buildBuiltInStages(
    effectiveState: SetupState,
    mobileResultBucket: { current: MobileRunResult | null }
  ): SetupStage<unknown>[] {
    const prepareLocalModelStage: SetupStage<unknown> = {
      id: "prepare-local-model",
      title: wizardMessage(input.locale, "setupOllamaInstalling"),
      skip: () => !requiresAiSetup(effectiveState)
        || configuredLocalModelKey(stateToConfig(input.initialConfig, effectiveState, input.context, input.projectConfig)) === null,
      run: async (): Promise<StageResult> => {
        const nextConfig = stateToConfig(input.initialConfig, effectiveState, input.context, input.projectConfig);
        await ensureLocalModelForConfig(nextConfig);
        return { status: "ok" };
      }
    };

    const saveConfigStage: SetupStage<unknown> = {
      id: "save-config",
      title: wizardMessage(input.locale, "setupSaving"),
      run: async (ctx): Promise<StageResult> => {
        let projectConfig: unknown = ctx.projectConfig;
        let cliConfig = stateToConfig(input.initialConfig, effectiveState, input.context, projectConfig);

        const customSteps = (input.context.features.setup.customSteps ?? []) as CustomSetupStep<unknown>[];
        for (const step of customSteps) {
          const value = effectiveState.customValues[step.id];
          if (value === undefined) continue;
          const result = await step.write(projectConfig, String(value), cliConfig);
          projectConfig = result.projectConfig;
          if (result.cliConfig) cliConfig = result.cliConfig;
        }

        const merged = await ctx.config.mergeCliConfig(cliConfig, projectConfig);
        await ctx.config.saveProjectConfig(merged);
        input.setSavedProjectConfig(merged);
        return { status: "ok" };
      }
    };

    const mobileInstallStage: SetupStage<unknown> = {
      id: "mobile-install",
      title: wizardMessage(input.locale, "setupMobileInstalling"),
      skip: () => effectiveState.mobileInstall !== "install" || !input.context.features.mobile,
      run: async (): Promise<StageResult> => {
        const result = await runSetupMobileInstall(input.context, effectiveState, {
          appendProgress: input.progress.appendProgress,
          updateLastProgress: input.progress.updateLastProgress,
          appendOutput: input.progress.appendOutput,
          startDeviceInstall: input.progress.startDeviceInstall,
          completeDeviceInstall: input.progress.completeDeviceInstall,
          selectDevices
        });
        if (result) {
          mobileResultBucket.current = result;
          input.setMobileResult(result);
        }
        return { status: "ok" };
      }
    };

    return [prepareLocalModelStage, saveConfigStage, mobileInstallStage];
  }

  async function saveAndExit(override?: Partial<SetupState>): Promise<void> {
    const effectiveState: SetupState = override ? { ...input.state, ...override } : input.state;
    input.setError(null);
    input.setPhase("pipeline");
    input.progress.resetProgress();

    const mobileResultBucket: { current: MobileRunResult | null } = { current: null };
    const abortController = new AbortController();
    const stageCtx = buildStageContext<unknown>(effectiveState, abortController.signal);
    const builtIn = buildBuiltInStages(effectiveState, mobileResultBucket);
    const hostStages = (input.context.features.setup.stages ?? []) as SetupStage<unknown>[];
    const postMobileStages = hostStages.filter(
      (s) => (s as { insertAfter?: string }).insertAfter === "mobile-install"
    );
    const initialStages = [...builtIn, ...hostStages.filter((stage) => !postMobileStages.includes(stage))];
    const callbacks: StageRunnerCallbacks = {
      resetStageProgress: () => input.progress.resetProgress(),
      setStageTitle: (title) => input.progress.setStageTitle(title),
      setCurrentStageId: (id) => input.setCurrentStageId(id),
      setError: (message) => input.setError(message ? friendlySetupError(input.locale, message) : null),
      enterError: () => input.setPhase("error"),
      requestStageInput: async (request: StageInputRequest) => {
        throw new Error(`Stage input not yet wired in wizard UI: ${request.kind}/${request.id}`);
      }
    };

    const pipelineResult = await runStagePipeline(initialStages, stageCtx, callbacks);

    if (!pipelineResult.ok) {
      return;
    }

    if (override) {
      input.setState((previous) => ({ ...previous, ...override }));
    }

    const mobileResult = mobileResultBucket.current;
    if (mobileResult && !mobileResult.ok) {
      if (onlyHasIosTrustIssue(mobileResult)) {
        if (postMobileStages.length > 0) {
          const postPipelineResult = await runStagePipeline(postMobileStages, stageCtx, callbacks);
          if (!postPipelineResult.ok) {
            return;
          }
        }
        input.setMobileNotice("ios-trust");
        input.setPhase("done");
        return;
      }
      input.setPhase("mobileRetry");
      return;
    }

    if (postMobileStages.length > 0) {
      const postPipelineResult = await runStagePipeline(postMobileStages, stageCtx, callbacks);
      if (!postPipelineResult.ok) {
        return;
      }
    }

    // Stay on the completion view until the user exits (Enter or Ctrl+C). This
    // keeps long-running launches (e.g. session mode babysitting services) and
    // their ready info on screen instead of tearing down the fullscreen UI and
    // leaving a blank terminal.
    input.setPhase("done");
  }

  async function prepareLocalModel(): Promise<boolean> {
    input.setError(null);
    // Wait until Ink has actually rendered the pipeline screen before
    // handing off to the installer (which may call spawnSync and block
    // the event loop). The resolve callback is stored in the ref and fired
    // from a useEffect + stdout.write('', cb) barrier in wizard.tsx, which
    // guarantees the terminal has received the new frame.
    await new Promise<void>((resolve) => {
      input.onPipelineRendered.current = resolve;
      input.setPhase("pipeline");
      input.progress.resetProgress();
      input.progress.setStageTitle(wizardMessage(input.locale, "setupOllamaInstalling"));
    });
    try {
      const nextConfig = stateToConfig(input.initialConfig, input.state, input.context, input.projectConfig);
      await ensureLocalModelForConfig(nextConfig);
      input.progress.setStageTitle(null);
      input.setPhase("setup");
      return true;
    } catch (saveError) {
      if (saveError instanceof Error && (saveError as Error & { cancelled?: boolean }).cancelled) {
        input.progress.resetProgress();
        input.setPhase("setup");
        return false;
      }
      input.setError(friendlySetupError(input.locale, saveError instanceof Error ? saveError.message : wizardMessage(input.locale, "setupFailed")));
      input.setPhase("error");
      return false;
    }
  }

  function requiresAiSetup(effectiveState: SetupState): boolean {
    return shouldRequireAiSetup(input.context, effectiveState, input.projectConfig, input.initialConfig);
  }

  async function ensureLocalModelForConfig(nextConfig: PubwaveCliConfig): Promise<void> {
    const localModelKey = configuredLocalModelKey(nextConfig);
    if (localModelKey && preparedLocalModelKey.current === localModelKey) {
      return;
    }

    const localInstall = await ensureSetupLocalModel(input.context, nextConfig, {
      appendProgress: input.progress.appendProgress,
      updateLastProgress: input.progress.updateLastProgress,
      appendOutput: input.progress.appendOutput,
      setInstallMessage: input.progress.setInstallMessage,
      resetProgress: input.progress.resetProgress,
      setStageTitle: input.progress.setStageTitle
    });
    if (localInstall && !localInstall.ok) {
      const err = new Error(localInstall.detail);
      if (localInstall.cancelled) {
        (err as Error & { cancelled: boolean }).cancelled = true;
      }
      throw err;
    }
    if (localInstall?.ok) {
      input.refreshLocalModelChoices();
    }
    if (localModelKey) {
      preparedLocalModelKey.current = localModelKey;
    }
  }

  async function retryMobileInstall(): Promise<void> {
    const effectiveState = input.state;
    input.setError(null);
    input.setPhase("pipeline");
    input.progress.resetProgress();

    const mobileResultBucket: { current: MobileRunResult | null } = { current: null };
    const abortController = new AbortController();
    const stageCtx = buildStageContext<unknown>(effectiveState, abortController.signal);

    const mobileOnlyStage: SetupStage<unknown> = {
      id: "mobile-install",
      title: wizardMessage(input.locale, "setupMobileInstalling"),
      skip: () => effectiveState.mobileInstall !== "install" || !input.context.features.mobile,
      run: async (): Promise<StageResult> => {
        const result = await runSetupMobileInstall(input.context, effectiveState, {
          appendProgress: input.progress.appendProgress,
          updateLastProgress: input.progress.updateLastProgress,
          appendOutput: input.progress.appendOutput,
          startDeviceInstall: input.progress.startDeviceInstall,
          completeDeviceInstall: input.progress.completeDeviceInstall,
          selectDevices
        });
        if (result) {
          mobileResultBucket.current = result;
          input.setMobileResult(result);
        }
        return { status: "ok" };
      }
    };

    const retryCallbacks: StageRunnerCallbacks = {
      resetStageProgress: () => input.progress.resetProgress(),
      setStageTitle: (title) => input.progress.setStageTitle(title),
      setCurrentStageId: (id) => input.setCurrentStageId(id),
      setError: (message) => input.setError(message ? friendlySetupError(input.locale, message) : null),
      enterError: () => input.setPhase("error"),
      requestStageInput: async (request: StageInputRequest) => {
        throw new Error(`Stage input not yet wired in wizard UI: ${request.kind}/${request.id}`);
      }
    };

    const pipelineResult = await runStagePipeline([mobileOnlyStage], stageCtx, retryCallbacks);

    if (!pipelineResult.ok) {
      return;
    }

    const mobileResult = mobileResultBucket.current;
    if (mobileResult && !mobileResult.ok && !onlyHasIosTrustIssue(mobileResult)) {
      input.setPhase("mobileRetry");
      return;
    }

    const hostStages = (input.context.features.setup.stages ?? []) as SetupStage<unknown>[];
    const postMobileStages = hostStages.filter(
      (s) => (s as { insertAfter?: string }).insertAfter === "mobile-install"
    );
    if (postMobileStages.length > 0) {
      const postPipelineResult = await runStagePipeline(postMobileStages, stageCtx, retryCallbacks);
      if (!postPipelineResult.ok) {
        return;
      }
    }

    if (mobileResult && !mobileResult.ok && onlyHasIosTrustIssue(mobileResult)) {
      input.setMobileNotice("ios-trust");
      input.setPhase("done");
      return;
    }

    // Stay on the completion view until the user exits (Enter or Ctrl+C). This
    // keeps long-running launches (e.g. session mode babysitting services) and
    // their ready info on screen instead of tearing down the fullscreen UI and
    // leaving a blank terminal.
    input.setPhase("done");
  }

  async function skipMobileInstallAndContinue(): Promise<void> {
    const effectiveState = input.state;
    input.setError(null);
    input.setPhase("pipeline");
    input.progress.resetProgress();

    const abortController = new AbortController();
    const stageCtx = buildStageContext<unknown>(effectiveState, abortController.signal);
    const hostStages = (input.context.features.setup.stages ?? []) as SetupStage<unknown>[];
    const postMobileStages = hostStages.filter(
      (s) => (s as { insertAfter?: string }).insertAfter === "mobile-install"
    );
    const callbacks: StageRunnerCallbacks = {
      resetStageProgress: () => input.progress.resetProgress(),
      setStageTitle: (title) => input.progress.setStageTitle(title),
      setCurrentStageId: (id) => input.setCurrentStageId(id),
      setError: (message) => input.setError(message ? friendlySetupError(input.locale, message) : null),
      enterError: () => input.setPhase("error"),
      requestStageInput: async (request: StageInputRequest) => {
        throw new Error(`Stage input not yet wired in wizard UI: ${request.kind}/${request.id}`);
      }
    };

    if (postMobileStages.length > 0) {
      const postPipelineResult = await runStagePipeline(postMobileStages, stageCtx, callbacks);
      if (!postPipelineResult.ok) {
        return;
      }
    }

    // Stay on the completion view until the user exits (Enter or Ctrl+C). This
    // keeps long-running launches (e.g. session mode babysitting services) and
    // their ready info on screen instead of tearing down the fullscreen UI and
    // leaving a blank terminal.
    input.setPhase("done");
  }

  return { prepareLocalModel, saveAndExit, retryMobileInstall, skipMobileInstallAndContinue, mobileDeviceSelectionResolver };
}

function configuredLocalModelKey(config: PubwaveCliConfig): string | null {
  return config.ai?.modelSource === "local" && config.ai.provider === "local" && config.ai.model
    ? config.ai.model
    : null;
}
