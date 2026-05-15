import { wizardMessage } from "../../../../shared/i18n/wizard/index.js";
import { uninstallOllamaModel } from "../../../models/ollama/install.js";
import { applyChoice } from "../../state/choice.js";
import { handleInlineTextInput } from "../../state/inline-input.js";
import type { WizardInputContext, WizardInputKey } from "./context.js";

export function handleSetupInput(
  ctx: WizardInputContext,
  value: string,
  key: WizardInputKey
): void {
  if (key.escape) {
    ctx.exit();
    return;
  }

  if (ctx.showInlineModelInput) {
    handleInlineTextInput({
      field: "model",
      value,
      key,
      state: ctx.state,
      setState: ctx.setState,
      onSubmit: () => {
        void continueOrSave(ctx);
      }
    });
    return;
  }

  if (key.leftArrow) {
    ctx.setInputError(null);
    ctx.setStepIndex((previous) => (previous > 0 ? previous - 1 : previous));
    return;
  }

  if (key.upArrow || key.downArrow) {
    handleChoiceNavigation(ctx, key);
    return;
  }

  if (key.delete && ctx.currentStep.id === "model" && ctx.state.modelSource === "local") {
    const selectedChoice = ctx.currentStep.choices[ctx.selectedIndex];
    if (selectedChoice?.group === "installed") {
      uninstallOllamaModel(selectedChoice.value);
      if (ctx.state.model === selectedChoice.value) {
        ctx.setState((previous) => ({ ...previous, model: "" }));
      }
      ctx.refreshLocalModelChoices();
      return;
    }
  }

  if (ctx.currentStep.kind === "input") {
    handleTextStepInput(ctx, value, key);
    return;
  }

  if (key.return) {
    void continueOrSave(ctx);
  }
}

function handleChoiceNavigation(ctx: WizardInputContext, key: WizardInputKey): void {
  if (ctx.currentStep.kind === "input") {
    return;
  }

  if (
    key.downArrow
    && ctx.currentStep.id === "model"
    && ctx.state.modelSource === "cloud"
    && ctx.selectedIndex >= ctx.currentStep.choices.length - 1
  ) {
    ctx.setState((previous) => ({
      ...previous,
      cloudModelInputMode: true,
      model: ""
    }));
    return;
  }

  const nextIndex = key.upArrow
    ? (ctx.selectedIndex <= 0 ? ctx.currentStep.choices.length - 1 : ctx.selectedIndex - 1)
    : (ctx.selectedIndex >= ctx.currentStep.choices.length - 1 ? 0 : ctx.selectedIndex + 1);
  const nextChoice = ctx.currentStep.choices[nextIndex];
  if (nextChoice) {
    ctx.setState((previous) => applyChoice(ctx.context, previous, ctx.currentStep, nextChoice, ctx.localModelChoices));
  }
}

function handleTextStepInput(
  ctx: WizardInputContext,
  value: string,
  key: WizardInputKey
): void {
  if (
    key.return
    && ctx.currentStep.id === "apiKey"
    && ctx.state.modelSource === "cloud"
    && ctx.state.apiKey.trim().length === 0
  ) {
    ctx.setInputError(wizardMessage(ctx.locale, "apiKeyRequired"));
    return;
  }
  if (!key.return) {
    ctx.setInputError(null);
  }
  handleInlineTextInput({
    field: resolveInputField(ctx.currentStep.id, ctx.currentStep.inputValueKey),
    value,
    key,
    state: ctx.state,
    setState: ctx.setState,
    onSubmit: () => {
      void continueOrSave(ctx);
    }
  });
}

function resolveInputField(stepId: string, inputValueKey: "model" | "apiKey" | undefined): string {
  if (stepId === "apiKey") return "apiKey";
  if (inputValueKey === "model") return "model";
  return stepId;
}

async function continueOrSave(ctx: WizardInputContext): Promise<void> {
  ctx.setInputError(null);
  if (ctx.isLastStep) {
    await ctx.saveAndExit();
  } else {
    if (ctx.currentStep.id === "model" && ctx.state.modelSource === "local") {
      const prepared = await ctx.prepareLocalModel();
      if (!prepared) {
        return;
      }
    }
    ctx.setStepIndex((previous) => previous + 1);
  }
}
