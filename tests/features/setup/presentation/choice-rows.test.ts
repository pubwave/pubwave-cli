import { describe, expect, it } from "vitest";
import { buildChoiceRenderRows, localModelGroupTitle } from "../../../../src/features/setup/presentation/choice-rows.js";
import type { SetupStep } from "../../../../src/features/setup/types.js";

describe("buildChoiceRenderRows (flat)", () => {
  const step = {
    id: "language",
    title: "",
    hint: "",
    choices: [
      { label: "English", value: "en" },
      { label: "中文", value: "zh-CN" }
    ]
  } as SetupStep;

  it("marks the selected row with a caret and green color", () => {
    const rows = buildChoiceRenderRows(step, "en", "en");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ kind: "choice", text: "› English", color: "green", choiceValue: "en" });
    expect(rows[1]).toMatchObject({ kind: "choice", text: "  中文", choiceValue: "zh-CN" });
    expect(rows[1]!.color).toBeUndefined();
  });
});

describe("buildChoiceRenderRows (grouped)", () => {
  const step = {
    id: "model",
    title: "",
    hint: "",
    choices: [
      { label: "qwen3:8b (Installed)", value: "qwen3:8b" },
      { label: "qwen2.5:7b", value: "qwen2.5:7b" }
    ],
    choiceGroups: [
      { id: "installed", choices: [{ label: "qwen3:8b (Installed)", value: "qwen3:8b", group: "installed" }] },
      { id: "recommended", choices: [{ label: "qwen2.5:7b", value: "qwen2.5:7b", group: "recommended" }] }
    ]
  } as SetupStep;

  it("emits group headers and a gap between groups", () => {
    const rows = buildChoiceRenderRows(step, "en", "qwen3:8b");
    expect(rows.map((r) => r.kind)).toEqual(["group", "choice", "gap", "group", "choice"]);
    const selected = rows.find((r) => r.choiceValue === "qwen3:8b");
    expect(selected!.text).toBe("› qwen3:8b (Installed)");
    expect(selected!.color).toBe("green");
  });
});

describe("localModelGroupTitle", () => {
  it("returns a non-empty localized title for each group", () => {
    for (const id of ["installed", "recommended", "more"] as const) {
      expect(localModelGroupTitle("en", id)).toBeTruthy();
    }
  });
});
