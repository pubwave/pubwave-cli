import React, { useEffect, useMemo, useRef, useState } from "react";
import { useApp, useStdout } from "ink";
import type { CliCommandContext, PubwaveCliConfig } from "../../core/types.js";
import type { MobileRunResult } from "../mobile/types.js";
import {
  detectWizardLocale,
  isWizardLocale,
  wizardMessage,
  type WizardLocale
} from "../../shared/i18n/wizard/index.js";
import { SetupPhaseRouter } from "./components/phase-router.js";
import { useAnimatedDots } from "./hooks/use-animated-dots.js";
import { useLocalModelChoices } from "./hooks/use-local-model-choices.js";
import { useSetupProgressState } from "./hooks/use-progress-state.js";
import { useTerminalSize } from "./hooks/use-terminal-size.js";
import { useWizardInput } from "./hooks/use-wizard-input.js";
import { useWizardSave } from "./hooks/use-wizard-save.js";
import { wizardPanelHeight, wizardSectionWidth, wizardStepVisibleRowCount } from "./layout/sizing.js";
import type { MobileRetryGuideKind } from "./mobile/error-analysis.js";
import { currentChoiceIndex } from "./state/choice.js";
import { createInitialState } from "./state/initial-state.js";
import { buildSteps } from "./state/steps.js";
import type { MobileDeviceChoiceState, SetupPhase, SetupState } from "./types.js";

export function SetupWizard(props: {
  context: CliCommandContext;
  initialConfig: PubwaveCliConfig;
  projectConfig: unknown;
}): React.ReactElement {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const { rows, columns } = useTerminalSize();
  const onPipelineRendered = useRef<(() => void) | null>(null);
  const detectedLocale = detectWizardLocale();
  const [state, setState] = useState<SetupState>(
    () => createInitialState(props.context, props.initialConfig, detectedLocale, props.projectConfig)
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState<SetupPhase>("setup");
  const [error, setError] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [mobileResult, setMobileResult] = useState<MobileRunResult | null>(null);
  const [mobileNotice, setMobileNotice] = useState<MobileRetryGuideKind | null>(null);
  const [mobileRetryOpened, setMobileRetryOpened] = useState(false);
  const [mobileDeviceChoiceState, setMobileDeviceChoiceState] = useState<MobileDeviceChoiceState | null>(null);
  const [mobileDeviceCursorIndex, setMobileDeviceCursorIndex] = useState(0);
  const [currentStageId, setCurrentStageId] = useState<string | null>(null);
  // The merged project config produced + persisted during save, so the
  // completion view shows the values the wizard just wrote. Falls back to the
  // pre-wizard project config until save has run.
  const [savedProjectConfig, setSavedProjectConfig] = useState<unknown>(props.projectConfig);
  const { choices: localModelChoices, refresh: refreshLocalModelChoices } = useLocalModelChoices(props.context, state.modelSource);
  const progress = useSetupProgressState();
  const installedLocalDefaultApplied = useRef(false);
  const locale: WizardLocale = isWizardLocale(state.language) ? state.language : detectedLocale;
  const savingDots = useAnimatedDots(
    phase === "localModelInstalling"
      || phase === "saving"
      || phase === "mobileInstalling"
      || phase === "pipeline"
  );
  const steps = useMemo(
    () => buildSteps(props.context, state, locale, localModelChoices, props.projectConfig, props.initialConfig),
    [locale, localModelChoices, props.context, props.initialConfig, props.projectConfig, state]
  );
  const currentStep = steps[stepIndex] ?? steps[0]!;
  const nextStep = steps[stepIndex + 1];
  const selectedIndex = currentChoiceIndex(currentStep, state);
  useEffect(() => {
    if (state.modelSource !== "local" || localModelChoices.length === 0) {
      return;
    }

    // Only correct the selection when the current model isn't an option at all
    // (list refreshed, the installed model was deleted, or a stale config value).
    // Otherwise the user's own navigation to a recommended/more entry would be
    // snapped back, making it impossible to pick a not-yet-installed model.
    if (localModelChoices.some((choice) => choice.value === state.model)) {
      return;
    }

    const fallback = localModelChoices.find((choice) => choice.group === "installed")
      ?? localModelChoices[0];
    if (!fallback) {
      return;
    }

    setState((current) => current.modelSource === "local" && current.model === state.model
      ? { ...current, model: fallback.value }
      : current);
  }, [localModelChoices, state.model, state.modelSource]);
  useEffect(() => {
    if (state.modelSource !== "local") {
      installedLocalDefaultApplied.current = false;
      return;
    }

    if ((currentStep.id !== "model" && nextStep?.id !== "model") || installedLocalDefaultApplied.current) {
      return;
    }

    const installedChoice = localModelChoices.find((choice) => choice.group === "installed");
    if (!installedChoice) {
      return;
    }

    installedLocalDefaultApplied.current = true;
    setState((current) => current.modelSource === "local" && current.model !== installedChoice.value
      ? { ...current, model: installedChoice.value }
      : current);
  }, [currentStep.id, localModelChoices, nextStep?.id, state.modelSource]);
  useEffect(() => {
    setStepIndex((current) => Math.max(0, Math.min(current, steps.length - 1)));
  }, [steps.length]);
  useEffect(() => {
    if (phase !== "pipeline" || !onPipelineRendered.current) {
      return;
    }
    const cb = onPipelineRendered.current;
    onPipelineRendered.current = null;
    // stdout.write('', cb) queues the callback behind all prior Ink writes,
    // guaranteeing the terminal has the new frame before we proceed.
    stdout.write("", cb);
  }, [phase, stdout]);
  const hasMobileInstall = state.mobileInstall === "install" && !!props.context.features.mobile;
  const isMobileStage = currentStageId === "mobile-install";
  const postMobileStages = ((props.context.features.setup.stages ?? []) as Array<{ id: string; insertAfter?: string }>)
    .filter((s) => s.insertAfter === "mobile-install");
  const postMobileStageIds = new Set(postMobileStages.map((s) => s.id));
  const isPostMobileStage = currentStageId !== null && postMobileStageIds.has(currentStageId);
  const mobileDisplayCount = hasMobileInstall ? 1 : 0;
  const postMobileBaseIndex = steps.length + mobileDisplayCount;
  const displayStepsLength = postMobileBaseIndex + postMobileStages.length;
  const mobileStepIndex = steps.length;
  const displayStepIndex = phase === "done"
    ? displayStepsLength - 1
    : hasMobileInstall && (phase === "mobileRetry" || phase === "mobileDeviceChoice" || (phase === "pipeline" && isMobileStage))
      ? mobileStepIndex
      : phase === "pipeline" && isPostMobileStage
        ? postMobileBaseIndex + postMobileStages.findIndex((s) => s.id === currentStageId)
        : stepIndex;

  const isInstalledModelSelected = currentStep.id === "model"
    && state.modelSource === "local"
    && currentStep.choices[selectedIndex]?.group === "installed";
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex >= steps.length - 1;
  const compactMode = rows < 18;
  const sectionWidth = wizardSectionWidth(columns);
  const panelHeight = wizardPanelHeight(rows);
  const showInlineModelInput = currentStep.id === "model" && state.modelSource === "cloud" && state.cloudModelInputMode;
  const description = showInlineModelInput
    ? currentStep.description ?? ""
    : currentStep.kind === "input"
      ? currentStep.description ?? ""
      : currentStep.choices[selectedIndex]?.description ?? "";
  const navigationText = [
    wizardMessage(locale, currentStep.kind === "input" || showInlineModelInput ? "inputNav" : "chooseNav"),
    ...(isInstalledModelSelected ? [wizardMessage(locale, "deleteNav")] : []),
    wizardMessage(locale, currentStep.kind === "input" || showInlineModelInput ? "inputContinueNav" : "continueNav"),
    ...(isFirstStep
      ? []
      : [wizardMessage(locale, currentStep.kind === "input" || showInlineModelInput ? "inputBackNav" : "backNav")])
  ].join(", ");
  const maxVisibleRows = wizardStepVisibleRowCount({
    panelHeight,
    sectionWidth,
    compactMode,
    bannerTitle: props.context.app.name,
    title: currentStep.title,
    hint: currentStep.hint,
    description,
    navigationText
  });
  const { prepareLocalModel, saveAndExit, retryMobileInstall, skipMobileInstallAndContinue, mobileDeviceSelectionResolver } = useWizardSave({
    context: props.context,
    initialConfig: props.initialConfig,
    projectConfig: props.projectConfig,
    state,
    setState,
    setSavedProjectConfig,
    locale,
    progress,
    setPhase,
    setError,
    setMobileResult,
    setMobileNotice,
    setMobileDeviceChoiceState,
    setMobileDeviceCursorIndex,
    setCurrentStageId,
    refreshLocalModelChoices,
    exit,
    onPipelineRendered
  });
  useWizardInput({
    context: props.context,
    initialConfig: props.initialConfig,
    phase,
    state,
    setState,
    currentStep,
    selectedIndex,
    showInlineModelInput,
    isLastStep,
    localModelChoices,
    locale,
    mobileResult,
    mobileRetryOpened,
    setMobileRetryOpened,
    mobileDeviceChoiceState,
    setMobileDeviceChoiceState,
    mobileDeviceCursorIndex,
    setMobileDeviceCursorIndex,
    mobileDeviceSelectionResolver,
    setInputError,
    setStepIndex,
    setPhase,
    prepareLocalModel,
    saveAndExit,
    retryMobileInstall,
    skipMobileInstallAndContinue,
    refreshLocalModelChoices,
    exit
  });

  return (
    <SetupPhaseRouter
      appName={props.context.app.name}
      context={props.context}
      initialConfig={props.initialConfig}
      projectConfig={props.projectConfig}
      savedProjectConfig={savedProjectConfig}
      phase={phase}
      state={state}
      locale={locale}
      steps={steps}
      stepIndex={displayStepIndex}
      stepsLength={displayStepsLength}
      currentStep={currentStep}
      selectedIndex={selectedIndex}
      showInlineModelInput={showInlineModelInput}
      isFirstStep={isFirstStep}
      isLastStep={isLastStep}
      width={sectionWidth}
      height={panelHeight}
      compactMode={compactMode}
      description={description}
      maxVisibleRows={maxVisibleRows}
      inputError={inputError}
      error={error}
      savingDots={savingDots}
      mobileResult={mobileResult}
      mobileNotice={mobileNotice}
      mobileRetryOpened={mobileRetryOpened}
      mobileDeviceChoiceState={mobileDeviceChoiceState}
      mobileDeviceCursorIndex={mobileDeviceCursorIndex}
      progress={progress}
    />
  );
}
