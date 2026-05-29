import { beforeEach, describe, expect, it, vi } from "vitest";
import { configSetCommand } from "../../../src/core/commands/config-commands.js";
import { ensureConfiguredLocalModel } from "../../../src/core/commands/local-model-bridge.js";
import type { CliCommandContext, PubwaveCliConfig } from "../../../src/core/types.js";

vi.mock("../../../src/core/commands/local-model-bridge.js", () => ({
  ensureConfiguredLocalModel: vi.fn()
}));

const mockEnsure = vi.mocked(ensureConfiguredLocalModel);

function makeStubContext(initial: PubwaveCliConfig) {
  const saved: { count: number; last: PubwaveCliConfig | null } = { count: 0, last: null };
  const ctx = {
    features: { localModel: { enabled: true } },
    config: {
      loadCliConfig: vi.fn(async () => initial),
      saveCliConfig: vi.fn(async (next: PubwaveCliConfig) => { saved.count += 1; saved.last = next; })
    }
  } as unknown as CliCommandContext;
  return { ctx, saved };
}

beforeEach(() => {
  mockEnsure.mockReset();
});

describe("configSetCommand — save deferred until local install succeeds (Fix #4)", () => {
  it("saves the config when there's no local install to run", async () => {
    mockEnsure.mockResolvedValue(null);
    const { ctx, saved } = makeStubContext({ ai: { modelSource: "cloud" } } as PubwaveCliConfig);
    await configSetCommand().run(ctx, {});
    expect(saved.count).toBe(1);
    expect(mockEnsure).toHaveBeenCalledOnce();
  });

  it("does NOT save when the local install fails", async () => {
    mockEnsure.mockResolvedValue({ ok: false, detail: "ollama pull failed" });
    const { ctx, saved } = makeStubContext({} as PubwaveCliConfig);
    await configSetCommand().run(ctx, { "model-source": "local", provider: "local", model: "qwen3:8b" });
    expect(saved.count).toBe(0);
  });

  it("saves after the local install succeeds", async () => {
    mockEnsure.mockResolvedValue({ ok: true, detail: "installed" });
    const { ctx, saved } = makeStubContext({} as PubwaveCliConfig);
    await configSetCommand().run(ctx, { "model-source": "local", provider: "local", model: "qwen3:8b" });
    expect(saved.count).toBe(1);
    expect(saved.last?.ai?.modelSource).toBe("local");
    expect(saved.last?.ai?.model).toBe("qwen3:8b");
  });

  it("invokes ensureConfiguredLocalModel before saving (correct ordering)", async () => {
    const callOrder: string[] = [];
    mockEnsure.mockImplementation(async () => { callOrder.push("ensure"); return null; });
    const { ctx } = makeStubContext({} as PubwaveCliConfig);
    (ctx.config.saveCliConfig as ReturnType<typeof vi.fn>).mockImplementation(async () => { callOrder.push("save"); });
    await configSetCommand().run(ctx, {});
    expect(callOrder).toEqual(["ensure", "save"]);
  });
});
