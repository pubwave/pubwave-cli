import { describe, expect, it } from "vitest";
import { buildSteps, shouldRequireAiSetup } from "../../../../src/features/setup/state/steps.js";
import { makeContext, makeState } from "../../../helpers/context.js";
import type { PubwaveCliConfig } from "../../../../src/core/types.js";

const cli = {} as PubwaveCliConfig;
const ids = (steps: { id: string }[]) => steps.map((s) => s.id);

describe("buildSteps", () => {
  it("builds the full cloud path", () => {
    const steps = buildSteps(makeContext(), makeState({ modelSource: "cloud" }), "en", [], {}, cli);
    expect(ids(steps)).toEqual(["language", "modelSource", "provider", "model", "apiKey"]);
  });

  it("builds the shorter local path", () => {
    const steps = buildSteps(makeContext(), makeState({ modelSource: "local" }), "en", [{ label: "m", value: "m" }], {}, cli);
    expect(ids(steps)).toEqual(["language", "modelSource", "model"]);
  });

  it("appends a mobileInstall step when mobile is a feature", () => {
    const steps = buildSteps(makeContext({ mobile: true }), makeState({ modelSource: "cloud" }), "en", [], {}, cli);
    expect(ids(steps)).toContain("mobileInstall");
    expect(ids(steps).at(-1)).toBe("mobileInstall");
  });

  it("reduces to just the language step when AI setup is not required", () => {
    const ctx = makeContext({ setup: { shouldRequireAiSetup: () => false } });
    expect(ids(buildSteps(ctx, makeState(), "en", [], {}, cli))).toEqual(["language"]);
  });

  it("inserts a custom step after its anchor", () => {
    const ctx = makeContext({
      setup: {
        customSteps: [
          {
            id: "team",
            insertAfter: "language",
            kind: "choice",
            title: "Team",
            read: () => "",
            write: async (projectConfig) => ({ projectConfig }),
            choices: [{ label: "A", value: "a" }]
          }
        ]
      }
    });
    const result = ids(buildSteps(ctx, makeState({ modelSource: "cloud" }), "en", [], {}, cli));
    expect(result[0]).toBe("language");
    expect(result[1]).toBe("team");
  });

  it("builds local model choice groups from grouped choices", () => {
    const localChoices = [
      { label: "qwen3:8b (Installed)", value: "qwen3:8b", group: "installed" as const },
      { label: "qwen2.5:7b", value: "qwen2.5:7b", group: "recommended" as const },
      { label: "phi4:14b", value: "phi4:14b", group: "more" as const }
    ];
    const steps = buildSteps(makeContext(), makeState({ modelSource: "local" }), "en", localChoices, {}, cli);
    const modelStep = steps.find((s) => s.id === "model")!;
    expect(modelStep.choiceGroups?.map((g) => g.id)).toEqual(["installed", "recommended", "more"]);
  });
});

describe("shouldRequireAiSetup", () => {
  it("delegates to the configured predicate", () => {
    expect(shouldRequireAiSetup(makeContext(), makeState(), {}, cli)).toBe(true);
    expect(shouldRequireAiSetup(makeContext({ setup: { shouldRequireAiSetup: () => false } }), makeState(), {}, cli)).toBe(false);
  });
});
