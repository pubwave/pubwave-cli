import { useCallback, useRef, useState } from "react";
import type { DeviceRunResult, MobileInstallableDevice } from "../../mobile/types.js";
import { mergeOutputLines, normalizeSetupOutputLines } from "../progress/output.js";
import type {
  CountedHandle,
  IndeterminateHandle,
  ProgressColor,
  RichProgressApi,
  StatusCard
} from "../progress-types.js";
import type { DeviceInstallState, ProgressLine } from "../types.js";
import { MAX_OUTPUT_LINES } from "../types.js";

export interface SetupProgressState extends RichProgressApi {
  progressLines: ProgressLine[];
  outputLines: ProgressLine[];
  deviceInstallStates: DeviceInstallState[];
  installMessage: string | null;
  statusCards: StatusCard[];
  stageTitle: string | null;
  setInstallMessage(message: string | null): void;
  startDeviceInstall(device: MobileInstallableDevice): void;
  completeDeviceInstall(result: DeviceRunResult): void;
}

export function useSetupProgressState(): SetupProgressState {
  const [progressLines, setProgressLines] = useState<ProgressLine[]>([]);
  const [outputLines, setOutputLines] = useState<ProgressLine[]>([]);
  const [deviceInstallStates, setDeviceInstallStates] = useState<DeviceInstallState[]>([]);
  const [installMessage, setInstallMessage] = useState<string | null>(null);
  const [statusCards, setStatusCards] = useState<StatusCard[]>([]);
  const [stageTitle, setStageTitle] = useState<string | null>(null);
  const countedCounters = useRef<Map<string, { total: number; current: number }>>(new Map());

  const resetProgress = useCallback((): void => {
    setProgressLines([]);
    setOutputLines([]);
    setDeviceInstallStates([]);
    setInstallMessage(null);
    setStatusCards([]);
    countedCounters.current.clear();
  }, []);

  const appendProgress = useCallback((text: string, color: ProgressColor = "yellow", completedText?: string): void => {
    setProgressLines((lines) => [...lines, { text, color, completedText }]);
  }, []);

  const updateLastProgress = useCallback((text: string, color: ProgressColor = "yellow", completedText?: string): void => {
    setProgressLines((lines) => {
      if (lines.length === 0) {
        return [{ text, color, completedText }];
      }
      const nextLines = [...lines];
      const lastLine = nextLines[nextLines.length - 1]!;
      nextLines[nextLines.length - 1] = { ...lastLine, text, color, completedText };
      return nextLines;
    });
  }, []);

  const appendOutput = useCallback((rawText: string, stream: "stdout" | "stderr", device?: MobileInstallableDevice): void => {
    const nextLines = normalizeSetupOutputLines(rawText)
      .map((text) => ({ text, color: stream === "stderr" ? "yellow" as const : "cyan" as const }));
    if (nextLines.length === 0) {
      return;
    }

    if (device) {
      setDeviceInstallStates((states) => states.map((item) => item.deviceId === device.id
        ? { ...item, outputLines: mergeOutputLines(item.outputLines, nextLines).slice(-MAX_OUTPUT_LINES) }
        : item));
      return;
    }

    setOutputLines((lines) => mergeOutputLines(lines, nextLines).slice(-MAX_OUTPUT_LINES));
  }, []);

  const startDeviceInstall = useCallback((device: MobileInstallableDevice): void => {
    setDeviceInstallStates((states) => states.some((item) => item.deviceId === device.id)
      ? states.map((item) => item.deviceId === device.id ? { ...item, status: "installing", detail: undefined } : item)
      : [...states, { deviceId: device.id, label: device.label, status: "installing", outputLines: [] }]);
  }, []);

  const completeDeviceInstall = useCallback((result: DeviceRunResult): void => {
    setDeviceInstallStates((states) => states.map((item) => item.deviceId === result.device.id
      ? {
          ...item,
          status: result.ok ? "completed" : "failed",
          detail: result.ok ? undefined : result.detail
        }
      : item));
  }, []);

  const beginIndeterminate = useCallback((label: string, color: ProgressColor = "cyan"): IndeterminateHandle => {
    appendProgress(label, color);
    return {
      complete(nextLabel, nextColor = "green") {
        updateLastProgress(nextLabel ?? label, nextColor, nextLabel ?? label);
      },
      fail(failLabel, detail) {
        updateLastProgress(failLabel, "red", detail ?? failLabel);
      }
    };
  }, [appendProgress, updateLastProgress]);

  const beginCounted = useCallback((label: string, total: number, color: ProgressColor = "cyan"): CountedHandle => {
    const id = `counted-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    countedCounters.current.set(id, { total, current: 0 });
    const initial = `${label} [0/${total}]`;
    appendProgress(initial, color);
    return {
      advance(delta = 1, currentLabel) {
        const entry = countedCounters.current.get(id);
        if (!entry) return;
        entry.current = Math.min(entry.current + delta, entry.total);
        const detail = currentLabel ? `${label} [${entry.current}/${entry.total}] ${currentLabel}` : `${label} [${entry.current}/${entry.total}]`;
        updateLastProgress(detail, color);
      },
      complete(completeLabel, completeColor = "green") {
        const entry = countedCounters.current.get(id);
        const finalText = completeLabel
          ?? (entry ? `${label} [${entry.total}/${entry.total}]` : label);
        updateLastProgress(finalText, completeColor, finalText);
        countedCounters.current.delete(id);
      },
      fail(failLabel, detail) {
        updateLastProgress(failLabel, "red", detail ?? failLabel);
        countedCounters.current.delete(id);
      }
    };
  }, [appendProgress, updateLastProgress]);

  const appendStatusCard = useCallback((card: StatusCard): void => {
    setStatusCards((cards) => {
      const existingIndex = cards.findIndex((entry) => entry.id === card.id);
      if (existingIndex >= 0) {
        const next = [...cards];
        next[existingIndex] = card;
        return next;
      }
      return [...cards, card];
    });
  }, []);

  const setStageTitleApi = useCallback((text: string | null): void => {
    setStageTitle(text);
  }, []);

  return {
    progressLines,
    outputLines,
    deviceInstallStates,
    installMessage,
    statusCards,
    stageTitle,
    setInstallMessage,
    resetProgress,
    appendProgress,
    updateLastProgress,
    appendOutput,
    beginIndeterminate,
    beginCounted,
    appendStatusCard,
    setStageTitle: setStageTitleApi,
    startDeviceInstall,
    completeDeviceInstall
  };
}
