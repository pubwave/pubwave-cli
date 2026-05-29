import { describe, expect, it } from "vitest";
import { render } from "ink-testing-library";
import { SavedSetupView } from "../../src/features/setup/components/saved-view.js";
import { makeContext } from "../helpers/context.js";
import type { PubwaveCliConfig } from "../../src/core/types.js";

describe("SavedSetupView", () => {
  it("renders the saved config summary (guards the memoized savedViewCtx change)", () => {
    const context = makeContext();
    const initialConfig = {
      language: "en",
      ai: { modelSource: "cloud", provider: "openai", model: "gpt-5.2" }
    } as PubwaveCliConfig;
    const { lastFrame, unmount } = render(
      <SavedSetupView context={context} initialConfig={initialConfig} projectConfig={{}} />
    );
    const frame = lastFrame() ?? "";
    expect(frame).toContain("gpt-5.2");
    expect(frame).toContain("openai");
    unmount();
  });

  it("renders host-provided additional config rows", () => {
    const context = makeContext({
      setup: { configRows: [{ label: "Workspace", value: "/repo/app" }] }
    });
    const { lastFrame, unmount } = render(
      <SavedSetupView context={context} initialConfig={{ language: "en" } as PubwaveCliConfig} projectConfig={{}} />
    );
    expect(lastFrame() ?? "").toContain("/repo/app");
    unmount();
  });
});
