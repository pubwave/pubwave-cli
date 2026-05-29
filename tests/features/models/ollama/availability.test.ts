import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  availableOllamaModelChoices,
  installedOllamaModels,
  isOllamaModelInstalled,
  isOllamaModelInstalledAsync
} from "../../../../src/features/models/ollama/availability.js";
import { runCommand, runCommandAsync } from "../../../../src/node/process.js";
import type { ModelChoice } from "../../../../src/features/models/types.js";

vi.mock("../../../../src/node/process.js", () => ({
  runCommand: vi.fn(),
  runCommandAsync: vi.fn()
}));
vi.mock("../../../../src/features/models/ollama/runtime/index.js", () => ({
  resolveOllamaExecutable: () => "/usr/local/bin/ollama"
}));

const mockRunCommand = vi.mocked(runCommand);
const mockRunCommandAsync = vi.mocked(runCommandAsync);

const LIST_OUTPUT = [
  "NAME                 ID            SIZE     MODIFIED",
  "qwen3:8b             500a1f067a9f  5.2 GB   8 hours ago",
  "all-minilm:latest    1b226e2802db  45 MB    1 minute ago"
].join("\n");

function ok(stdout: string) {
  return { ok: true, exitCode: 0, stdout, stderr: "" };
}

beforeEach(() => {
  mockRunCommand.mockReturnValue(ok(LIST_OUTPUT));
  mockRunCommandAsync.mockResolvedValue(ok(LIST_OUTPUT));
});

describe("installedOllamaModels", () => {
  it("parses model names from `ollama list`, skipping the header", () => {
    expect(installedOllamaModels().map((m) => m.value)).toEqual(["qwen3:8b", "all-minilm:latest"]);
  });

  it("returns an empty list when the command fails", () => {
    mockRunCommand.mockReturnValue({ ok: false, exitCode: 1, stdout: "", stderr: "boom" });
    expect(installedOllamaModels()).toEqual([]);
  });
});

describe("isOllamaModelInstalled (tag normalization)", () => {
  it("matches an exact tagged name", () => {
    expect(isOllamaModelInstalled("qwen3:8b")).toBe(true);
  });

  it("matches an untagged name against an installed :latest entry", () => {
    expect(isOllamaModelInstalled("all-minilm")).toBe(true);
  });

  it("does not over-match: untagged name normalizes to :latest, not tag-stripping", () => {
    expect(isOllamaModelInstalled("qwen3")).toBe(false);
  });

  it("rejects a wrong tag and an unknown model", () => {
    expect(isOllamaModelInstalled("all-minilm:bogus")).toBe(false);
    expect(isOllamaModelInstalled("does-not-exist")).toBe(false);
  });
});

describe("isOllamaModelInstalledAsync", () => {
  it("uses the async list and applies the same normalization", async () => {
    await expect(isOllamaModelInstalledAsync("all-minilm")).resolves.toBe(true);
    await expect(isOllamaModelInstalledAsync("qwen3")).resolves.toBe(false);
    expect(mockRunCommandAsync).toHaveBeenCalled();
  });
});

describe("availableOllamaModelChoices", () => {
  it("returns the recommended list unchanged when nothing is installed", () => {
    mockRunCommand.mockReturnValue({ ok: false, exitCode: 1, stdout: "", stderr: "" });
    const recommended: ModelChoice[] = [{ label: "qwen2.5:7b", value: "qwen2.5:7b", group: "recommended" }];
    expect(availableOllamaModelChoices(recommended)).toBe(recommended);
  });

  it("surfaces installed models first and de-dups them out of recommended", () => {
    const recommended: ModelChoice[] = [
      { label: "qwen3:8b", value: "qwen3:8b", group: "recommended" },
      { label: "qwen2.5:7b", value: "qwen2.5:7b", group: "recommended" }
    ];
    const merged = availableOllamaModelChoices(recommended);
    expect(merged.map((c) => c.value)).toEqual(["qwen3:8b", "all-minilm:latest", "qwen2.5:7b"]);
    expect(merged[0]!.group).toBe("installed");
    expect(merged[1]!.group).toBe("installed");
  });

  it("de-dups an untagged recommended entry against an installed :latest one", () => {
    mockRunCommand.mockReturnValue(ok("NAME               ID    SIZE\nall-minilm:latest  abc   45 MB"));
    const recommended: ModelChoice[] = [{ label: "all-minilm", value: "all-minilm", group: "recommended" }];
    const merged = availableOllamaModelChoices(recommended);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ value: "all-minilm:latest", group: "installed" });
  });
});
