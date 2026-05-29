import { describe, expect, it } from "vitest";
import { render } from "ink-testing-library";
import { PlainChoiceList } from "../../src/features/setup/components/primitives/choice-list.js";
import type { SetupStep } from "../../src/features/setup/types.js";

describe("PlainChoiceList", () => {
  const groupedModelStep = {
    id: "model",
    title: "",
    hint: "",
    choices: [
      { label: "qwen3:8b (Installed)", value: "qwen3:8b", group: "installed" },
      { label: "qwen2.5:7b", value: "qwen2.5:7b", group: "recommended" },
      { label: "qwen2.5:14b", value: "qwen2.5:14b", group: "recommended" },
      { label: "llama3.1:8b", value: "llama3.1:8b", group: "more" }
    ],
    choiceGroups: [
      { id: "installed", choices: [{ label: "qwen3:8b (Installed)", value: "qwen3:8b", group: "installed" }] },
      {
        id: "recommended",
        choices: [
          { label: "qwen2.5:7b", value: "qwen2.5:7b", group: "recommended" },
          { label: "qwen2.5:14b", value: "qwen2.5:14b", group: "recommended" }
        ]
      },
      { id: "more", choices: [{ label: "llama3.1:8b", value: "llama3.1:8b", group: "more" }] }
    ]
  } as SetupStep;

  it("keeps grouped local-model headers visible when row budget is tight", () => {
    const { lastFrame, unmount } = render(
      <PlainChoiceList
        currentStep={groupedModelStep}
        locale="en"
        selectedIndex={1}
        width={80}
        maxVisibleRows={4}
      />
    );

    const frame = lastFrame() ?? "";
    expect(frame).toContain("Installed models");
    expect(frame).toContain("Recommended models");
    expect(frame).toContain("More options");
    expect(frame).toContain("› qwen2.5:7b");
    expect(frame).not.toContain("qwen2.5:14b");
    unmount();
  });

  it("keeps blank spacing between groups when row budget allows it", () => {
    const { lastFrame, unmount } = render(
      <PlainChoiceList
        currentStep={groupedModelStep}
        locale="en"
        selectedIndex={1}
        width={80}
        maxVisibleRows={9}
      />
    );

    const frame = lastFrame() ?? "";
    expect(frame).toContain("qwen3:8b (Installed)");
    expect(frame).toContain("Installed models\n  qwen3:8b (Installed)\n\nRecommended models");
    expect(frame).toContain("qwen2.5:14b\n\nMore options");
    unmount();
  });
});
