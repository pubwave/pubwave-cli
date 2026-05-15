import type { ProgressLine } from "./types.js";

export type ProgressColor = NonNullable<ProgressLine["color"]>;

export interface IndeterminateHandle {
  complete(label?: string, color?: ProgressColor): void;
  fail(label: string, detail?: string): void;
}

export interface CountedHandle {
  advance(delta?: number, currentLabel?: string): void;
  complete(label?: string, color?: ProgressColor): void;
  fail(label: string, detail?: string): void;
}

export interface StatusCard {
  id: string;
  title: string;
  rows?: { label: string; value?: string }[];
  hint?: string;
  color?: ProgressColor;
}

export interface RichProgressApi {
  resetProgress(): void;
  appendProgress(text: string, color?: ProgressColor, completedText?: string): void;
  updateLastProgress(text: string, color?: ProgressColor, completedText?: string): void;
  appendOutput(rawText: string, stream: "stdout" | "stderr"): void;
  beginIndeterminate(label: string, color?: ProgressColor): IndeterminateHandle;
  beginCounted(label: string, total: number, color?: ProgressColor): CountedHandle;
  appendStatusCard(card: StatusCard): void;
  setStageTitle(text: string | null): void;
}
