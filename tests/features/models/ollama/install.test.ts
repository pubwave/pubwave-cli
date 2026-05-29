import { beforeEach, describe, expect, it, vi } from "vitest";
import { uninstallOllamaModelAsync } from "../../../../src/features/models/ollama/install.js";
import { runCommandAsync } from "../../../../src/node/process.js";
import { resolveOllamaExecutable } from "../../../../src/features/models/ollama/runtime/index.js";

vi.mock("../../../../src/node/process.js", () => ({
  runCommand: vi.fn(),
  runCommandAsync: vi.fn()
}));
vi.mock("../../../../src/features/models/ollama/runtime/index.js", () => ({
  resolveOllamaExecutable: vi.fn(() => "/usr/local/bin/ollama"),
  createOllamaRuntimeManager: vi.fn()
}));

const mockRunAsync = vi.mocked(runCommandAsync);
const mockResolveExe = vi.mocked(resolveOllamaExecutable);

beforeEach(() => {
  mockResolveExe.mockReturnValue("/usr/local/bin/ollama");
});

describe("uninstallOllamaModelAsync (Fix #12 — non-blocking delete)", () => {
  it("uses the async process runner (not the sync one)", async () => {
    mockRunAsync.mockResolvedValue({ ok: true, exitCode: 0, stdout: "", stderr: "" });
    await uninstallOllamaModelAsync("qwen3:8b");
    expect(mockRunAsync).toHaveBeenCalledWith("/usr/local/bin/ollama", ["rm", "qwen3:8b"]);
  });

  it("returns a success result with a clear message", async () => {
    mockRunAsync.mockResolvedValue({ ok: true, exitCode: 0, stdout: "", stderr: "" });
    await expect(uninstallOllamaModelAsync("qwen3:8b")).resolves.toEqual({
      ok: true,
      detail: "qwen3:8b removed."
    });
  });

  it("surfaces stderr when rm fails", async () => {
    mockRunAsync.mockResolvedValue({ ok: false, exitCode: 1, stdout: "", stderr: "model not found" });
    const result = await uninstallOllamaModelAsync("nope");
    expect(result.ok).toBe(false);
    expect(result.detail).toBe("model not found");
  });

  it("falls back to stdout when stderr is empty on failure", async () => {
    mockRunAsync.mockResolvedValue({ ok: false, exitCode: 1, stdout: "no such model", stderr: "" });
    expect((await uninstallOllamaModelAsync("nope")).detail).toBe("no such model");
  });

  it("reports a clear message when ollama isn't on PATH", async () => {
    mockResolveExe.mockReturnValueOnce(null);
    const result = await uninstallOllamaModelAsync("qwen3:8b");
    expect(result.ok).toBe(false);
    expect(result.detail).toMatch(/not installed|not available/);
    expect(mockRunAsync).not.toHaveBeenCalled();
  });
});
