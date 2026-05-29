import { describe, expect, it, vi } from "vitest";
import { runStagePipeline, sortStages, type StageRunnerCallbacks } from "../../../src/features/setup/stage-runner.js";
import type { SetupStage, StageResult } from "../../../src/features/setup/stage-types.js";

function stage(id: string, opts: Partial<SetupStage<unknown>> = {}): SetupStage<unknown> {
  return {
    id,
    title: id,
    run: opts.run ?? (async (): Promise<StageResult> => ({ status: "ok" })),
    ...opts
  } as SetupStage<unknown>;
}

function makeCallbacks() {
  const ran: string[] = [];
  const errors: (string | null)[] = [];
  let enteredError = 0;
  const requestStageInput = vi.fn(async () => "answer");
  const cb: StageRunnerCallbacks = {
    resetStageProgress: () => {},
    setStageTitle: () => {},
    setCurrentStageId: (id) => { if (id) ran.push(id); },
    setError: (m) => errors.push(m),
    enterError: () => { enteredError += 1; },
    requestStageInput
  };
  return { cb, ran, errors, get enteredError() { return enteredError; }, requestStageInput };
}

function ctx() {
  return { abortSignal: new AbortController().signal } as never;
}

describe("sortStages", () => {
  it("orders standard stages by the canonical order", () => {
    const sorted = sortStages([stage("mobile-install"), stage("save-config"), stage("prepare-local-model")]);
    expect(sorted.map((s) => s.id)).toEqual(["prepare-local-model", "save-config", "mobile-install"]);
  });

  it("places insertBefore host stages just before their anchor", () => {
    const sorted = sortStages([
      stage("save-config"),
      stage("prepare-local-model"),
      stage("pre", { insertBefore: "save-config" })
    ]);
    expect(sorted.map((s) => s.id)).toEqual(["prepare-local-model", "pre", "save-config"]);
  });

  it("places insertAfter host stages just after their anchor", () => {
    const sorted = sortStages([stage("prepare-local-model"), stage("post", { insertAfter: "prepare-local-model" })]);
    expect(sorted.map((s) => s.id)).toEqual(["prepare-local-model", "post"]);
  });

  it("appends unanchored host stages at the end", () => {
    const sorted = sortStages([stage("custom-xyz"), stage("save-config")]);
    expect(sorted.map((s) => s.id)).toEqual(["save-config", "custom-xyz"]);
  });
});

describe("runStagePipeline", () => {
  it("runs non-skipped stages in sorted order", async () => {
    const { cb, ran } = makeCallbacks();
    const result = await runStagePipeline([stage("save-config"), stage("prepare-local-model")], ctx(), cb);
    expect(result.ok).toBe(true);
    expect(ran).toEqual(["prepare-local-model", "save-config"]);
  });

  it("skips a stage whose skip() returns true", async () => {
    const { cb, ran } = makeCallbacks();
    await runStagePipeline(
      [stage("prepare-local-model", { skip: async () => true }), stage("save-config")],
      ctx(),
      cb
    );
    expect(ran).toEqual(["save-config"]);
  });

  it("stops and reports on a failed stage", async () => {
    const h = makeCallbacks();
    const result = await runStagePipeline(
      [stage("save-config", { run: async () => ({ status: "failed", detail: "boom" }) })],
      ctx(),
      h.cb
    );
    expect(result.ok).toBe(false);
    expect(result.failedStageId).toBe("save-config");
    expect(result.detail).toBe("boom");
    expect(h.errors).toContain("boom");
    expect(h.enteredError).toBe(1);
  });

  it("treats a thrown error as a stage failure", async () => {
    const { cb } = makeCallbacks();
    const result = await runStagePipeline(
      [stage("save-config", { run: async () => { throw new Error("kaboom"); } })],
      ctx(),
      cb
    );
    expect(result.ok).toBe(false);
    expect(result.detail).toBe("kaboom");
  });

  it("continues past a failed stage when continueOnError is set", async () => {
    const { cb, ran } = makeCallbacks();
    const result = await runStagePipeline(
      [
        stage("prepare-local-model", { continueOnError: true, run: async () => ({ status: "failed", detail: "x" }) }),
        stage("save-config")
      ],
      ctx(),
      cb
    );
    expect(result.ok).toBe(true);
    expect(ran).toContain("save-config");
  });

  it("bails out immediately when the abort signal is already aborted", async () => {
    const { cb, ran } = makeCallbacks();
    const controller = new AbortController();
    controller.abort();
    const result = await runStagePipeline([stage("save-config")], { abortSignal: controller.signal } as never, cb);
    expect(result).toEqual({ ok: false, aborted: true });
    expect(ran).toEqual([]);
  });

  it("requests input and resumes a needs-input stage", async () => {
    const { cb, requestStageInput } = makeCallbacks();
    const resume = vi.fn(async (): Promise<StageResult> => ({ status: "ok" }));
    const result = await runStagePipeline(
      [stage("save-config", {
        run: async (): Promise<StageResult> => ({
          status: "needs-input",
          input: { kind: "choice", id: "pick", prompt: "Pick", options: [], resume } as never
        })
      })],
      ctx(),
      cb
    );
    expect(requestStageInput).toHaveBeenCalledOnce();
    expect(resume).toHaveBeenCalledWith("answer");
    expect(result.ok).toBe(true);
  });
});
