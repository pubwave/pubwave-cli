import React from "react";
import type { CliCommandContext, PubwaveCliConfig } from "../../../core/types.js";
import type { MobileRunResult } from "../../mobile/types.js";
import { wizardMessage, type WizardLocale } from "../../../shared/i18n/wizard/index.js";
import type { MobileRetryGuideKind } from "../mobile/error-analysis.js";
import type { StatusCard } from "../progress-types.js";
import { stateToConfig } from "../state/state-to-config.js";
import type {
  DeviceInstallState,
  MobileDeviceChoiceState,
  ProgressLine,
  SetupPhase,
  SetupState,
  SetupStep
} from "../types.js";
import { SetupCompletionView } from "./views/completion-view.js";
import { SetupCurrentStepView } from "./views/current-step-view.js";
import { SetupMobileDeviceChoiceView } from "./views/mobile/device-choice-view.js";
import { SetupMobileRetryView } from "./views/mobile/retry-view.js";
import { SetupProgressView } from "./views/progress-view.js";

interface ProgressSnapshot {
  progressLines: ProgressLine[];
  outputLines: ProgressLine[];
  deviceInstallStates: DeviceInstallState[];
  installMessage: string | null;
  statusCards: StatusCard[];
  stageTitle: string | null;
}

interface PhaseRouterProps {
  appName: string;
  context: CliCommandContext;
  initialConfig: PubwaveCliConfig;
  phase: SetupPhase;
  state: SetupState;
  locale: WizardLocale;
  steps: SetupStep[];
  stepIndex: number;
  stepsLength: number;
  currentStep: SetupStep;
  selectedIndex: number;
  showInlineModelInput: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
  width: number;
  height: number;
  compactMode: boolean;
  description: string;
  maxVisibleRows: number;
  inputError: string | null;
  error: string | null;
  savingDots: string;
  mobileResult: MobileRunResult | null;
  mobileNotice: MobileRetryGuideKind | null;
  mobileRetryOpened: boolean;
  mobileDeviceChoiceState: MobileDeviceChoiceState | null;
  mobileDeviceCursorIndex: number;
  progress: ProgressSnapshot;
}

export function SetupPhaseRouter(props: PhaseRouterProps): React.ReactElement {
  if (props.phase === "done") {
    return (
      <SetupCompletionView
        context={props.context}
        config={stateToConfig(props.initialConfig, props.state, props.context)}
        compactMode={props.compactMode}
        locale={props.locale}
        mobileNotice={props.mobileNotice}
        mobileResult={props.mobileResult}
        width={props.width}
        height={props.height}
        stepIndex={props.stepIndex}
        stepsLength={props.stepsLength}
      />
    );
  }

  if (props.phase === "error") {
    return (
      <SetupProgressView
        appName={props.appName}
        compactMode={props.compactMode}
        locale={props.locale}
        title={wizardMessage(props.locale, "setupFailed")}
        status={props.error ?? wizardMessage(props.locale, "setupFailed")}
        statusColor="red"
        savingDots=""
        progressLines={props.progress.progressLines}
        outputLines={props.progress.outputLines}
        deviceInstallStates={props.progress.deviceInstallStates}
        installMessage={props.progress.installMessage}
        statusCards={props.progress.statusCards}
        width={props.width}
        height={props.height}
        stepIndex={props.stepIndex}
        stepsLength={props.stepsLength}
      />
    );
  }

  if (props.phase === "mobileRetry") {
    return (
      <SetupMobileRetryView
        appName={props.appName}
        compactMode={props.compactMode}
        locale={props.locale}
        mobileResult={props.mobileResult}
        opened={props.mobileRetryOpened}
        width={props.width}
        height={props.height}
        stepIndex={props.stepIndex}
        stepsLength={props.stepsLength}
      />
    );
  }

  if (props.phase === "mobileDeviceChoice" && props.mobileDeviceChoiceState) {
    return (
      <SetupMobileDeviceChoiceView
        appName={props.appName}
        compactMode={props.compactMode}
        cursorIndex={Math.max(0, Math.min(props.mobileDeviceCursorIndex, props.mobileDeviceChoiceState.devices.length - 1))}
        devices={props.mobileDeviceChoiceState.devices}
        locale={props.locale}
        selectedDeviceIds={props.mobileDeviceChoiceState.selectedDeviceIds}
        width={props.width}
        height={props.height}
        stepIndex={props.stepIndex}
        stepsLength={props.stepsLength}
      />
    );
  }

  if (
    props.phase === "localModelInstalling"
    || props.phase === "saving"
    || props.phase === "mobileInstalling"
    || props.phase === "pipeline"
  ) {
    const titleKey = props.phase === "localModelInstalling"
      ? "setupLocalModelInstalling"
      : props.phase === "saving"
        ? "setupSaving"
        : props.phase === "mobileInstalling"
          ? "setupMobileInstalling"
          : null;
    const title = props.phase === "pipeline"
      ? props.progress.stageTitle ?? wizardMessage(props.locale, "setupSaving")
      : wizardMessage(props.locale, titleKey!);
    return (
      <SetupProgressView
        appName={props.appName}
        compactMode={props.compactMode}
        locale={props.locale}
        title={title}
        status={title}
        statusColor="cyanBright"
        savingDots={props.savingDots}
        progressLines={props.progress.progressLines}
        outputLines={props.progress.outputLines}
        deviceInstallStates={props.progress.deviceInstallStates}
        installMessage={props.progress.installMessage}
        statusCards={props.progress.statusCards}
        stepIndex={props.stepIndex}
        stepsLength={props.stepsLength}
        width={props.width}
        height={props.height}
      />
    );
  }

  return (
    <SetupCurrentStepView
      appName={props.appName}
      compactMode={props.compactMode}
      locale={props.locale}
      currentStep={props.currentStep}
      state={props.state}
      selectedIndex={props.selectedIndex}
      showInlineModelInput={props.showInlineModelInput}
      isFirstStep={props.isFirstStep}
      isLastStep={props.isLastStep}
      stepIndex={props.stepIndex}
      stepsLength={props.stepsLength}
      width={props.width}
      height={props.height}
      description={props.description}
      maxVisibleRows={props.maxVisibleRows}
      inputError={props.inputError}
    />
  );
}
