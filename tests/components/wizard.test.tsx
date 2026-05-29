import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { render } from "ink-testing-library";
import { SetupWizard } from "../../src/features/setup/wizard.js";
import { makeContext } from "../helpers/context.js";
import type { PubwaveCliConfig } from "../../src/core/types.js";

// Pin a deterministic installed-model list so the wizard's local-model step has
// one installed entry (qwen3:8b) plus the recommended/more groups. This is the
// scenario that triggered the navigation-lock bug.
vi.mock("../../src/features/models/ollama/availability.js", () => ({
  availableOllamaModelChoicesAsync: vi.fn(async (recommended: { value: string }[]) => [
    { label: "qwen3:8b (Installed)", value: "qwen3:8b", description: "Already installed in local Ollama.", group: "installed" },
    ...recommended.filter((c) => c.value !== "qwen3:8b")
  ]),
  availableOllamaModelChoices: vi.fn((r: unknown) => r),
  installedOllamaModels: vi.fn(() => []),
  installedOllamaModelsAsync: vi.fn(async () => []),
  isOllamaAvailable: vi.fn(() => true),
  isOllamaModelInstalled: vi.fn(() => false),
  isOllamaModelInstalledAsync: vi.fn(async () => false)
}));

const DOWN = "[B";
const ENTER = "\r";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function waitForFrame(lastFrame: () => string | undefined, predicate: (frame: string) => boolean, timeout = 4000): Promise<string> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const frame = lastFrame() ?? "";
    if (predicate(frame)) return frame;
    await sleep(15);
  }
  throw new Error(`waitForFrame timed out. Last frame:\n${lastFrame() ?? "<empty>"}`);
}

// Synthetic keystrokes can be dropped when Ink's input handler runs against a
// not-yet-committed React state (e.g. under CPU contention while the whole
// suite runs in parallel). Re-send the key until the expected frame appears so
// the test asserts navigation behaviour, not keystroke-delivery timing. A genuine
// navigation regression still fails here because the predicate is never reached.
async function pressUntil(
  stdin: { write: (data: string) => void },
  lastFrame: () => string | undefined,
  key: string,
  predicate: (frame: string) => boolean,
  timeout = 4000
): Promise<string> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (predicate(lastFrame() ?? "")) return lastFrame() ?? "";
    stdin.write(key);
    for (let waited = 0; waited < 200; waited += 15) {
      await sleep(15);
      if (predicate(lastFrame() ?? "")) return lastFrame() ?? "";
    }
  }
  throw new Error(`pressUntil(${JSON.stringify(key)}) timed out. Last frame:\n${lastFrame() ?? "<empty>"}`);
}

beforeAll(() => {
  // Give Ink a roomy viewport so nothing is clipped/windowed during the test.
  Object.defineProperty(process.stdout, "columns", { value: 120, configurable: true });
  Object.defineProperty(process.stdout, "rows", { value: 50, configurable: true });
});

afterEach(() => {
  vi.clearAllMocks();
});

function renderWizard() {
  const context = makeContext(); // localModel enabled, no mobile, default cloud providers
  // Pin language="en" so locale isn't timezone-dependent across test machines.
  const initialConfig = {
    language: "en",
    ai: { modelSource: "local", provider: "local", model: "qwen2.5:7b" }
  } as PubwaveCliConfig;
  return render(<SetupWizard context={context} initialConfig={initialConfig} projectConfig={{}} />);
}

describe("SetupWizard local-model navigation (Fix #1)", () => {
  it("renders the first (language) step", { retry: 2 }, async () => {
    const { lastFrame, unmount } = renderWizard();
    await waitForFrame(lastFrame, (f) => f.includes("/ 3"));
    expect(lastFrame()).toContain("1 / 3");
    unmount();
  });

  it("can move the cursor off the installed model onto recommended/more entries", { timeout: 15_000, retry: 2 }, async () => {
    const { lastFrame, stdin, unmount } = renderWizard();

    // Advance language -> modelSource -> model step. Wait for each transition
    // deterministically so the next keystroke doesn't race the previous render.
    await waitForFrame(lastFrame, (f) => f.includes("1 / 3"));
    stdin.write(ENTER);
    await waitForFrame(lastFrame, (f) => f.includes("2 / 3"));
    stdin.write(ENTER);

    // Wait until the model step has loaded the installed model and selected it
    // as the default.
    await waitForFrame(lastFrame, (f) => f.includes("› qwen3:8b (Installed)"));

    // Move down: the cursor must land on the recommended model and STAY there
    // (old buggy effect snapped it straight back to the installed entry).
    const afterDown = await pressUntil(stdin, lastFrame, DOWN, (f) => f.includes("› qwen2.5:7b"));
    expect(afterDown).not.toContain("› qwen3:8b"); // caret is no longer on the installed model

    // And it keeps moving freely through the rest of the list.
    await pressUntil(stdin, lastFrame, DOWN, (f) => f.includes("› qwen2.5:14b"));

    unmount();
  });

  it("defaults to the first installed local model when the model step opens", { timeout: 15_000, retry: 2 }, async () => {
    const { lastFrame, stdin, unmount } = renderWizard();
    await waitForFrame(lastFrame, (f) => f.includes("1 / 3"));
    stdin.write(ENTER);
    await waitForFrame(lastFrame, (f) => f.includes("2 / 3"));
    stdin.write(ENTER);

    const frame = await waitForFrame(lastFrame, (f) => f.includes("› qwen3:8b (Installed)") && f.includes("qwen2.5:7b"));
    expect(frame).not.toContain("› qwen2.5:7b");
    unmount();
  });

  it("shows installed and recommended group headers on the model step", { timeout: 15_000, retry: 2 }, async () => {
    const { lastFrame, stdin, unmount } = renderWizard();
    await waitForFrame(lastFrame, (f) => f.includes("1 / 3"));
    stdin.write(ENTER);
    await waitForFrame(lastFrame, (f) => f.includes("2 / 3"));
    stdin.write(ENTER);
    const frame = await waitForFrame(lastFrame, (f) => f.includes("qwen3:8b (Installed)") && f.includes("qwen2.5:7b"));
    // Both the installed entry and a recommended entry are present simultaneously.
    expect(frame).toContain("qwen3:8b (Installed)");
    expect(frame).toContain("qwen2.5:7b");
    unmount();
  });
});
