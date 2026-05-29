import type {
  SetupStage,
  StageInputRequest,
  StageResult,
  StageRunContext,
  StandardStageId
} from "./stage-types.js";

const STANDARD_STAGE_ORDER: StandardStageId[] = [
  "prepare-local-model",
  "save-config",
  "mobile-install"
];

export interface StageRunnerCallbacks {
  resetStageProgress?(): void;
  setStageTitle(title: string | null): void;
  setCurrentStageId(id: string | null): void;
  setError(message: string | null): void;
  enterError(): void;
  requestStageInput(input: StageInputRequest): Promise<string | string[] | boolean>;
}

export interface StagePipelineResult {
  ok: boolean;
  failedStageId?: string;
  detail?: string;
  aborted?: boolean;
}

export function sortStages<T>(stages: SetupStage<T>[]): SetupStage<T>[] {
  const result: SetupStage<T>[] = [];
  const remaining = [...stages];

  for (const standardId of STANDARD_STAGE_ORDER) {
    const insertBeforeForThis = remaining.filter((stage) => stage.insertBefore === standardId);
    for (const stage of insertBeforeForThis) {
      result.push(stage);
      removeStage(remaining, stage);
    }

    const standard = remaining.find((stage) => stage.id === standardId);
    if (standard) {
      result.push(standard);
      removeStage(remaining, standard);
    }

    const insertAfterForThis = remaining.filter((stage) => stage.insertAfter === standardId);
    for (const stage of insertAfterForThis) {
      result.push(stage);
      removeStage(remaining, stage);
    }
  }

  for (const stage of remaining) {
    result.push(stage);
  }

  return result;
}

function removeStage<T>(list: SetupStage<T>[], target: SetupStage<T>): void {
  const idx = list.indexOf(target);
  if (idx >= 0) list.splice(idx, 1);
}

export async function runStagePipeline<T>(
  stages: SetupStage<T>[],
  ctx: StageRunContext<T>,
  callbacks: StageRunnerCallbacks
): Promise<StagePipelineResult> {
  const ordered = sortStages(stages);

  for (const stage of ordered) {
    if (ctx.abortSignal.aborted) {
      return { ok: false, aborted: true };
    }

    if (stage.skip) {
      const should = await stage.skip(ctx);
      if (should) continue;
    }

    const title = typeof stage.title === "function" ? stage.title(ctx) : stage.title;
    callbacks.resetStageProgress?.();
    callbacks.setCurrentStageId(stage.id);
    callbacks.setStageTitle(title);

    let result: StageResult | void;
    try {
      result = await stage.run(ctx);
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      result = { status: "failed", detail };
    }

    while (result && result.status === "needs-input" && result.input) {
      const input = result.input;
      let value: string | string[] | boolean;
      try {
        value = await callbacks.requestStageInput(input);
      } catch (err) {
        result = { status: "failed", detail: err instanceof Error ? err.message : String(err) };
        break;
      }
      try {
        result = input.kind === "choice"
          ? await input.resume(value as string | string[])
          : await input.resume(value as boolean);
      } catch (err) {
        result = { status: "failed", detail: err instanceof Error ? err.message : String(err) };
      }
    }

    if (result && result.status === "failed") {
      if (stage.continueOnError) continue;
      callbacks.setError(result.detail ?? "Stage failed");
      callbacks.enterError();
      return { ok: false, failedStageId: stage.id, detail: result.detail };
    }
  }

  callbacks.setCurrentStageId(null);
  callbacks.setStageTitle(null);
  return { ok: true };
}
