import { beforeAll, describe, expect, it } from "vitest";
import { render } from "ink-testing-library";
import { SetupMobileNoticeView } from "../../src/features/setup/components/views/mobile/notice-view.js";

beforeAll(() => {
  Object.defineProperty(process.stdout, "columns", { value: 120, configurable: true });
  Object.defineProperty(process.stdout, "rows", { value: 40, configurable: true });
});

describe("SetupMobileNoticeView locale resilience (Fix #5)", () => {
  it("keeps the actionable prefix on the English ios-trust guide (comma split)", () => {
    const { lastFrame, unmount } = render(
      <SetupMobileNoticeView
        appName="Test"
        compactMode={false}
        locale="en"
        notice="ios-trust"
        width={100}
        height={30}
        stepIndex={0}
        stepsLength={1}
        configItems={[]}
      />
    );
    const frame = lastFrame() ?? "";
    expect(frame).toContain("Tap Trust");
    // The "press Enter to check again" tail is stripped (this screen has no Enter handler).
    expect(frame).not.toContain("press Enter to check again");
    unmount();
  });

  it("keeps the full Japanese ios-trust line when it has no comma to split on", () => {
    const { lastFrame, unmount } = render(
      <SetupMobileNoticeView
        appName="Test"
        compactMode={false}
        locale="ja"
        notice="ios-trust"
        width={100}
        height={30}
        stepIndex={0}
        stepsLength={1}
        configItems={[]}
      />
    );
    const frame = lastFrame() ?? "";
    // Pre-fix this whole line was dropped (return [] for "Enter" + no comma).
    // Post-fix it stays — actionable content survives in non-English locales.
    expect(frame).toContain("戻って");
    expect(frame).toContain("Enter");
    unmount();
  });
});
