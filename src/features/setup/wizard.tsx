import React, { useMemo, useState } from "react";
import { useApp } from "ink";
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
  const { rows, columns } = useTerminalSize();
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
  const { choices: localModelChoices, refresh: refreshLocalModelChoices } = useLocalModelChoices(props.context, state.modelSource);
  const progress = useSetupProgressState();
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
  const selectedIndex = currentChoiceIndex(currentStep, state);
  const hasMobileInstall = state.mobileInstall === "install" && !!props.context.features.mobile;
  const isMobileStage = currentStageId === "mobile-install";
  const postMobileStages = ((props.context.features.setup.stages ?? []) as Array<{ id: string; insertAfter?: string }>)
    .filter((s) => s.insertAfter === "mobile-install");
  const postMobileStageIds = new Set(postMobileStages.map((s) => s.id));
  const isPostMobileStage = currentStageId !== null && postMobileStageIds.has(currentStageId);
  const postMobileCount = hasMobileInstall ? postMobileStages.length : 0;
  const displayStepsLength = steps.length + (hasMobileInstall ? 1 : 0) + postMobileCount;
  const mobileStepIndex = steps.length;
  const displayStepIndex = phase === "done"
    ? steps.length - 1
    : hasMobileInstall && (phase === "mobileRetry" || phase === "mobileDeviceChoice" || (phase === "pipeline" && isMobileStage))
      ? mobileStepIndex
      : hasMobileInstall && phase === "pipeline" && isPostMobileStage
        ? mobileStepIndex + postMobileStages.findIndex((s) => s.id === currentStageId) + 1
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
    title: currentStep.title,
    hint: currentStep.hint,
    description,
    navigationText
  });
  const { prepareLocalModel, saveAndExit, retryMobileInstall, mobileDeviceSelectionResolver } = useWizardSave({
    context: props.context,
    initialConfig: props.initialConfig,
    projectConfig: props.projectConfig,
    state,
    setState,
    locale,
    progress,
    setPhase,
    setError,
    setMobileResult,
    setMobileNotice,
    setMobileDeviceChoiceState,
    setMobileDeviceCursorIndex,
    setCurrentStageId,
    exit
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
    refreshLocalModelChoices,
    exit
  });

  return (
    <SetupPhaseRouter
      appName={props.context.app.name}
      context={props.context}
      initialConfig={props.initialConfig}
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
