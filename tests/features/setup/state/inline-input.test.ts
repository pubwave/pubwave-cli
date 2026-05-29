import { describe, expect, it } from "vitest";
import {
  handleInlineTextInput,
  readFieldValue,
  writeFieldValue
} from "../../../../src/features/setup/state/inline-input.js";
import type { SetupState } from "../../../../src/features/setup/types.js";

function baseState(overrides: Partial<SetupState> = {}): SetupState {
  return {
    language: "en",
    modelSource: "cloud",
    provider: "openai",
    model: "",
    cloudModelInputMode: true,
    apiKey: "",
    mobileInstall: "skip",
    customValues: {},
    ...overrides
  };
}

function harness(initial: SetupState) {
  let state = initial;
  let submits = 0;
  const setState = (updater: SetupState | ((prev: SetupState) => SetupState)): void => {
    state = typeof updater === "function" ? (updater as (p: SetupState) => SetupState)(state) : updater;
  };
  return {
    get state() { return state; },
    setState: setState as never,
    onSubmit: () => { submits += 1; },
    get submits() { return submits; }
  };
}

describe("readFieldValue / writeFieldValue", () => {
  it("reads and writes the model and apiKey fields", () => {
    const s = baseState({ model: "gpt-5", apiKey: "sk" });
    expect(readFieldValue(s, "model")).toBe("gpt-5");
    expect(readFieldValue(s, "apiKey")).toBe("sk");
    expect(writeFieldValue(s, "model", "x").model).toBe("x");
    expect(writeFieldValue(s, "apiKey", "y").apiKey).toBe("y");
  });

  it("reads and writes custom fields via customValues", () => {
    const s = baseState({ customValues: { team: "acme" } });
    expect(readFieldValue(s, "team")).toBe("acme");
    expect(writeFieldValue(s, "team", "beta").customValues.team).toBe("beta");
    expect(readFieldValue(s, "missing")).toBe("");
  });
});

describe("handleInlineTextInput", () => {
  it("appends typed characters", () => {
    const h = harness(baseState({ model: "gp" }));
    handleInlineTextInput({ field: "model", value: "t", key: {}, state: h.state, setState: h.setState, onSubmit: h.onSubmit });
    expect(h.state.model).toBe("gpt");
    expect(h.submits).toBe(0);
  });

  it("removes the last character on backspace", () => {
    const h = harness(baseState({ model: "gpt" }));
    handleInlineTextInput({ field: "model", value: "", key: { backspace: true }, state: h.state, setState: h.setState, onSubmit: h.onSubmit });
    expect(h.state.model).toBe("gp");
  });

  it("trims and submits on Enter with a non-empty value", () => {
    const h = harness(baseState({ model: "  gpt-5  " }));
    handleInlineTextInput({ field: "model", value: "", key: { return: true }, state: h.state, setState: h.setState, onSubmit: h.onSubmit });
    expect(h.state.model).toBe("gpt-5");
    expect(h.submits).toBe(1);
  });

  it("does not submit an empty model on Enter", () => {
    const h = harness(baseState({ model: "   " }));
    handleInlineTextInput({ field: "model", value: "", key: { return: true }, state: h.state, setState: h.setState, onSubmit: h.onSubmit });
    expect(h.submits).toBe(0);
  });

  it("upArrow on the model field exits inline input and saves a draft", () => {
    const h = harness(baseState({ model: "custom-x", cloudModelInputMode: true }));
    handleInlineTextInput({ field: "model", value: "", key: { upArrow: true }, state: h.state, setState: h.setState, onSubmit: h.onSubmit });
    expect(h.state.cloudModelInputMode).toBe(false);
    expect(h.state.customModelDraft).toBe("custom-x");
    expect(h.submits).toBe(0);
  });

  it("ignores control/meta combinations", () => {
    const h = harness(baseState({ model: "abc" }));
    handleInlineTextInput({ field: "model", value: "c", key: { ctrl: true }, state: h.state, setState: h.setState, onSubmit: h.onSubmit });
    expect(h.state.model).toBe("abc");
  });
});
