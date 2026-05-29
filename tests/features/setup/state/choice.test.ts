import { describe, expect, it } from "vitest";
import { applyChoice, currentChoiceIndex, readStateValue } from "../../../../src/features/setup/state/choice.js";
import type { SetupStep } from "../../../../src/features/setup/types.js";
import { makeContext, makeState } from "../../../helpers/context.js";

const ctx = makeContext();

function step(id: string, choices: SetupStep["choices"] = []): SetupStep {
  return { id, title: "", hint: "", choices };
}

describe("applyChoice", () => {
  it("sets the language", () => {
    expect(applyChoice(ctx, makeState(), step("language"), { label: "Fr", value: "fr" }, []).language).toBe("fr");
  });

  it("switching to local sets provider=local, clears apiKey, picks first local choice", () => {
    const next = applyChoice(
      ctx,
      makeState({ apiKey: "sk" }),
      step("modelSource"),
      { label: "Local", value: "local" },
      [{ label: "m1", value: "m1" }]
    );
    expect(next).toMatchObject({ modelSource: "local", provider: "local", model: "m1", apiKey: "", cloudModelInputMode: false });
  });

  it("switching to local with no choices falls back to the configured default", () => {
    const next = applyChoice(ctx, makeState(), step("modelSource"), { label: "Local", value: "local" }, []);
    expect(next.model).toBe(ctx.features.localModel.choices[0]!.value);
  });

  it("switching to cloud picks the first provider and its first model", () => {
    const next = applyChoice(ctx, makeState({ modelSource: "local" }), step("modelSource"), { label: "Cloud", value: "cloud" }, []);
    expect(next.modelSource).toBe("cloud");
    expect(next.provider).toBe("openai");
    expect(next.model).toBe("gpt-5.2");
  });

  it("choosing a provider resets to its first model and clears apiKey", () => {
    const next = applyChoice(ctx, makeState({ apiKey: "sk" }), step("provider"), { label: "Anthropic", value: "anthropic" }, []);
    expect(next.provider).toBe("anthropic");
    expect(next.model).toBe("claude-opus-4-1");
    expect(next.apiKey).toBe("");
  });

  it("choosing a model sets it and exits inline input mode", () => {
    const next = applyChoice(ctx, makeState({ cloudModelInputMode: true }), step("model"), { label: "X", value: "gpt-5" }, []);
    expect(next).toMatchObject({ model: "gpt-5", cloudModelInputMode: false });
  });

  it("normalizes the mobileInstall choice", () => {
    expect(applyChoice(ctx, makeState(), step("mobileInstall"), { label: "", value: "install" }, []).mobileInstall).toBe("install");
    expect(applyChoice(ctx, makeState(), step("mobileInstall"), { label: "", value: "skip" }, []).mobileInstall).toBe("skip");
    expect(applyChoice(ctx, makeState(), step("mobileInstall"), { label: "", value: "other" }, []).mobileInstall).toBe("skip");
  });

  it("stores custom step values under customValues", () => {
    const next = applyChoice(ctx, makeState(), step("team"), { label: "Acme", value: "acme" }, []);
    expect(next.customValues.team).toBe("acme");
  });
});

describe("currentChoiceIndex", () => {
  it("returns the index of the current value", () => {
    const s = step("language", [{ label: "En", value: "en" }, { label: "Fr", value: "fr" }]);
    expect(currentChoiceIndex(s, makeState({ language: "fr" }))).toBe(1);
  });

  it("returns 0 when the value is not present", () => {
    const s = step("language", [{ label: "En", value: "en" }]);
    expect(currentChoiceIndex(s, makeState({ language: "zz" }))).toBe(0);
  });

  it("returns -1 on the model step while in inline input mode", () => {
    const s = step("model", [{ label: "X", value: "x" }]);
    expect(currentChoiceIndex(s, makeState({ cloudModelInputMode: true }))).toBe(-1);
  });
});

describe("readStateValue", () => {
  it("reads standard and custom values", () => {
    const s = makeState({ provider: "anthropic", customValues: { team: "acme" } });
    expect(readStateValue(s, "provider")).toBe("anthropic");
    expect(readStateValue(s, "team")).toBe("acme");
  });
});
