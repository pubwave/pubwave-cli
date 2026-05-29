import type { CliCommandContext } from "../../../core/types.js";
import type { ModelChoice } from "../../models/types.js";
import { isStandardSetupStepId, type SetupState, type SetupStep } from "../types.js";

export function applyChoice(
  context: CliCommandContext,
  state: SetupState,
  step: SetupStep,
  choice: ModelChoice,
  localModelChoices: ModelChoice[]
): SetupState {
  switch (step.id) {
    case "language":
      return { ...state, language: choice.value };
    case "modelSource": {
      if (choice.value === "local") {
        return {
          ...state,
          modelSource: "local",
          provider: "local",
          model: localModelChoices[0]?.value ?? context.features.localModel.choices[0]?.value ?? state.model,
          cloudModelInputMode: false,
          apiKey: ""
        };
      }

      const provider = context.features.cloudModel.providers[0];
      return {
        ...state,
        modelSource: "cloud",
        provider: provider?.value ?? "openai",
        cloudModelInputMode: false,
        model: provider?.models[0]?.value ?? state.model
      };
    }
    case "provider": {
      const provider = context.features.cloudModel.providers.find((entry) => entry.value === choice.value);
      return {
        ...state,
        provider: choice.value,
        cloudModelInputMode: false,
        apiKey: "",
        model: provider?.models[0]?.value ?? state.model
      };
    }
    case "model":
      return { ...state, model: choice.value, cloudModelInputMode: false };
    case "mobileInstall":
      return { ...state, mobileInstall: choice.value === "install" ? "install" : "skip" };
    default:
      if (!isStandardSetupStepId(step.id)) {
        return {
          ...state,
          customValues: { ...state.customValues, [step.id]: choice.value }
        };
      }
      return state;
  }
}

export function currentChoiceIndex(step: SetupStep, state: SetupState): number {
  if (step.id === "model" && state.cloudModelInputMode) {
    return -1;
  }

  const currentValue = readStateValue(state, step.id);
  const index = step.choices.findIndex((choice) => choice.value === currentValue);
  return index >= 0 ? index : 0;
}

export function readStateValue(state: SetupState, stepId: string): unknown {
  switch (stepId) {
    case "language":
      return state.language;
    case "modelSource":
      return state.modelSource;
    case "provider":
      return state.provider;
    case "model":
      return state.model;
    case "apiKey":
      return state.apiKey;
    case "mobileInstall":
      return state.mobileInstall;
    default:
      return state.customValues[stepId];
  }
}
