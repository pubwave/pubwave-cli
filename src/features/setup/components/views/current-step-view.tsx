import React from "react";
import { wizardMessage, type WizardLocale } from "../../../../shared/i18n/wizard/index.js";
import { readFieldValue } from "../../state/inline-input.js";
import type { SetupState, SetupStep } from "../../types.js";
import { PlainChoiceList } from "../primitives/choice-list.js";
import { SetupStepShell } from "../primitives/step-shell.js";
import { SetupTextInput } from "../primitives/text-input.js";

export function SetupCurrentStepView(props: {
  appName: string;
  compactMode: boolean;
  locale: WizardLocale;
  currentStep: SetupStep;
  state: SetupState;
  selectedIndex: number;
  showInlineModelInput: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
  stepIndex: number;
  stepsLength: number;
  width: number;
  height: number;
  description: string;
  maxVisibleRows: number;
  inputError: string | null;
}): React.ReactElement {
  const isInput = props.currentStep.kind === "input" || props.showInlineModelInput;
  return (
    <SetupStepShell
      appName={props.appName}
      compactMode={props.compactMode}
      kind={isInput ? "input" : "choice"}
      locale={props.locale}
      title={props.currentStep.title}
      hint={props.currentStep.hint}
      isFirstStep={props.isFirstStep}
      isLastStep={props.isLastStep}
      stepIndex={props.stepIndex}
      stepsLength={props.stepsLength}
      width={props.width}
      height={props.height}
      description={props.description}
      navigationText={props.isLastStep && isInput ? wizardMessage(props.locale, "inputContinueNav") : undefined}
    >
      {props.showInlineModelInput ? (
        <>
          <PlainChoiceList
            currentStep={props.currentStep}
            locale={props.locale}
            selectedIndex={props.selectedIndex}
            width={props.width}
            maxVisibleRows={Math.max(1, props.maxVisibleRows - 1)}
          />
          <SetupTextInput value={props.state.model} width={props.width} masked={false} />
        </>
      ) : props.currentStep.kind === "input"
        ? (
            <SetupTextInput
              value={readFieldValue(props.state, inputFieldFor(props.currentStep))}
              width={props.width}
              masked={props.currentStep.inputMask === true}
              error={props.currentStep.id === "apiKey" ? props.inputError : null}
            />
          )
        : (
            <PlainChoiceList
              currentStep={props.currentStep}
              locale={props.locale}
              selectedIndex={props.selectedIndex}
              width={props.width}
              maxVisibleRows={props.maxVisibleRows}
            />
          )}
    </SetupStepShell>
  );
}

function inputFieldFor(step: SetupStep): string {
  if (step.id === "apiKey") return "apiKey";
  if (step.inputValueKey === "model") return "model";
  return step.id;
}
