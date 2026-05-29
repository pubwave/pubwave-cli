import type React from "react";
import type { SetupState } from "../types.js";

interface InlineTextInputArgs {
  field: string;
  value: string;
  key: {
    return?: boolean;
    backspace?: boolean;
    delete?: boolean;
    ctrl?: boolean;
    meta?: boolean;
    escape?: boolean;
    upArrow?: boolean;
  };
  state: SetupState;
  setState: React.Dispatch<React.SetStateAction<SetupState>>;
  onSubmit: () => void;
}

export function handleInlineTextInput(input: InlineTextInputArgs): void {
  if (input.key.upArrow && input.field === "model") {
    input.setState((previous) => ({
      ...previous,
      cloudModelInputMode: false,
      customModelDraft: previous.model
    }));
    return;
  }

  const currentValue = readFieldValue(input.state, input.field);

  if (input.key.return) {
    if (currentValue.trim().length === 0 && input.field === "model") {
      return;
    }
    input.setState((previous) => writeFieldValue(previous, input.field, readFieldValue(previous, input.field).trim()));
    input.onSubmit();
    return;
  }

  if (input.key.backspace || input.key.delete) {
    input.setState((previous) => writeFieldValue(previous, input.field, readFieldValue(previous, input.field).slice(0, -1)));
    return;
  }

  if (!input.key.ctrl && !input.key.meta && !input.key.escape && input.value.length > 0) {
    input.setState((previous) => writeFieldValue(previous, input.field, `${readFieldValue(previous, input.field)}${input.value}`));
  }
}

export function readFieldValue(state: SetupState, field: string): string {
  if (field === "model") return state.model;
  if (field === "apiKey") return state.apiKey;
  const raw = state.customValues[field];
  return typeof raw === "string" ? raw : "";
}

export function writeFieldValue(state: SetupState, field: string, next: string): SetupState {
  if (field === "model") return { ...state, model: next };
  if (field === "apiKey") return { ...state, apiKey: next };
  return { ...state, customValues: { ...state.customValues, [field]: next } };
}
