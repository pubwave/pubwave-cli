import type React from "react";
import type { CliCommandContext, PubwaveCliConfig } from "../../../../core/types.js";
import type { ModelChoice } from "../../../models/types.js";
import type { MobileRunResult } from "../../../mobile/types.js";
import type { WizardLocale } from "../../../../shared/i18n/wizard/index.js";
import type { MobileDeviceChoiceState, SetupPhase, SetupState, SetupStep } from "../../types.js";

export interface WizardInputKey {
  return?: boolean;
  leftArrow?: boolean;
  rightArrow?: boolean;
  upArrow?: boolean;
  downArrow?: boolean;
  escape?: boolean;
  backspace?: boolean;
  delete?: boolean;
  ctrl?: boolean;
  meta?: boolean;
}

export interface WizardInputContext {
  context: CliCommandContext;
  initialConfig: PubwaveCliConfig;
  phase: SetupPhase;
  state: SetupState;
  setState: React.Dispatch<React.SetStateAction<SetupState>>;
  currentStep: SetupStep;
  selectedIndex: number;
  showInlineModelInput: boolean;
  isLastStep: boolean;
  localModelChoices: ModelChoice[];
  locale: WizardLocale;
  mobileResult: MobileRunResult | null;
  mobileRetryOpened: boolean;
  setMobileRetryOpened: React.Dispatch<React.SetStateAction<boolean>>;
  mobileDeviceChoiceState: MobileDeviceChoiceState | null;
  setMobileDeviceChoiceState: React.Dispatch<React.SetStateAction<MobileDeviceChoiceState | null>>;
  mobileDeviceCursorIndex: number;
  setMobileDeviceCursorIndex: React.Dispatch<React.SetStateAction<number>>;
  mobileDeviceSelectionResolver: React.MutableRefObject<((selectedDeviceIds: string[]) => void) | null>;
  setInputError: React.Dispatch<React.SetStateAction<string | null>>;
  setStepIndex: React.Dispatch<React.SetStateAction<number>>;
  setPhase: React.Dispatch<React.SetStateAction<SetupPhase>>;
  prepareLocalModel: () => Promise<boolean>;
  saveAndExit: (override?: Partial<SetupState>) => Promise<void>;
  retryMobileInstall: () => Promise<void>;
  skipMobileInstallAndContinue: () => Promise<void>;
  refreshLocalModelChoices: () => void;
  exit: () => void;
}
