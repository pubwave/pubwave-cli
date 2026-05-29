import { describe, expect, it } from "vitest";
import { render } from "ink-testing-library";
import { KeyValueList } from "../../src/ui/index.js";

describe("KeyValueList (Fix #7)", () => {
  it("hides items whose value is null or undefined, never renders the string 'null'", () => {
    const { lastFrame, unmount } = render(
      <KeyValueList items={[
        { label: "Language", value: "en" },
        { label: "Provider", value: undefined },
        { label: "Model", value: null as unknown }
      ]} />
    );
    const frame = lastFrame() ?? "";
    expect(frame).toContain("Language");
    expect(frame).toContain("en");
    expect(frame).not.toContain("Provider");
    expect(frame).not.toContain("Model");
    expect(frame).not.toContain("null");
    expect(frame).not.toContain("undefined");
    unmount();
  });

  it("renders both rows when labels collide (no React duplicate-key dedup)", () => {
    const { lastFrame, unmount } = render(
      <KeyValueList items={[
        { label: "Workspace", value: "first" },
        { label: "Workspace", value: "second" }
      ]} />
    );
    const frame = lastFrame() ?? "";
    expect(frame).toContain("first");
    expect(frame).toContain("second");
    unmount();
  });

  it("stringifies non-string values", () => {
    const { lastFrame, unmount } = render(
      <KeyValueList items={[
        { label: "Enabled", value: true },
        { label: "Count", value: 42 }
      ]} />
    );
    const frame = lastFrame() ?? "";
    expect(frame).toContain("true");
    expect(frame).toContain("42");
    unmount();
  });
});
