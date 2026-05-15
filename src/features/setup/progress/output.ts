import type { LocalModelInstallProgressStage } from "../../models/types.js";
import type { FlutterProgressEvent, MobileInstallableDevice, MobileProgressStage } from "../../mobile/types.js";
import { wizardProgressText } from "../../../shared/i18n/wizard/index.js";
import type { ProgressLine } from "../types.js";

export function stripTrailingDots(text: string): string {
  return text.replace(/\.{1,3}$/, "");
}

export function withAnimatedDots(text: string, dots: string): string {
  return `${stripTrailingDots(text)}${dots}`;
}

export function normalizeSetupOutputLines(rawText: string): string[] {
  return rawText
    .replace(/\[[0-9;?]*[ -/]*[@-~]/g, "")
    .split(/\r\n|\n|\r/g)
    .map((line) => sanitizeOutputLine(stripTrailingEta(line.trim())))
    .filter((line) => line.length > 0 && !isSetupNoiseLine(line));
}

export function mergeOutputLines(currentLines: ProgressLine[], incomingLines: ProgressLine[]): ProgressLine[] {
  return incomingLines.reduce((lines, line) => {
    const progressKey = setupOutputProgressKey(line.text);
    if (!progressKey) {
      return [...lines, line];
    }

    const nextLines = [...lines];
    const existingIndex = nextLines.findIndex((currentLine) => setupOutputProgressKey(currentLine.text) === progressKey);
    if (existingIndex >= 0) {
      nextLines[existingIndex] = line;
      return nextLines;
    }

    nextLines.push(line);
    return nextLines;
  }, currentLines);
}

export function setupOutputProgressKey(line: string): string | null {
  const normalized = line.trim().toLowerCase();

  if (/^\d+(\.\d+)?%$/.test(normalized)) {
    return "download-progress";
  }

  if (normalized.startsWith("downloading packages")) {
    return "flutter-pub-downloading-packages";
  }

  if (normalized.startsWith("resolving dependencies")) {
    return "flutter-pub-resolving-dependencies";
  }

  if (normalized.includes("waiting for another flutter command")) {
    return "flutter-startup-lock";
  }

  if (!normalized.startsWith("pulling ")) {
    return null;
  }

  const remainder = normalized.slice("pulling ".length).trim();
  const key = remainder.split(/[\s:]+/)[0];
  return key ? `pulling:${key}` : null;
}

export function localModelProgressText(locale: string | undefined, stage: LocalModelInstallProgressStage, model: string): string {
  const text = wizardProgressText(locale);
  switch (stage) {
    case "check-runtime":
      return text.checkOllama;
    case "install-runtime":
      return text.installOllama;
    case "start-runtime":
      return text.startRuntime;
    case "check-model":
      return `${text.checkLocalModel}: ${model}`;
    case "pull-model":
      return `${text.installLocalModel}: ${model}`;
    case "verify-model":
      return `${text.verifyLocalModel}: ${model}`;
  }
}

export function localModelProgressColor(stage: LocalModelInstallProgressStage): ProgressLine["color"] {
  return stage === "install-runtime" || stage === "pull-model" || stage === "start-runtime" ? "yellow" : "cyan";
}

export function mobileProgressText(locale: string | undefined, stage: MobileProgressStage, device?: MobileInstallableDevice): string {
  const text = wizardProgressText(locale);
  switch (stage) {
    case "mobile-project":
      return text.mobileProject;
    case "flutter":
      return text.flutter;
    case "dependencies":
      return text.dependencies;
    case "devices":
      return text.devices;
    case "android-tools":
      return text.androidTools;
    case "ios-tools":
      return text.iosTools;
    case "device-selection":
      return text.deviceSelection;
    case "install-device":
      return device ? `${text.installDevice}: ${device.label}` : text.installDevice;
  }
}

export function buildFlutterDownloadProgressText(locale: string | undefined, event: FlutterProgressEvent): string {
  const baseText = wizardProgressText(locale).flutterDownload;
  const receivedBytes = event.receivedBytes ?? 0;

  if (!event.totalBytes || event.totalBytes <= 0) {
    return `${baseText}: ${formatMegabytes(receivedBytes)}`;
  }

  const percent = Math.min(100, Math.floor((receivedBytes / event.totalBytes) * 100));
  return `${baseText}: ${percent}% (${formatMegabytes(receivedBytes)} / ${formatMegabytes(event.totalBytes)})`;
}

export function mobileFlutterExtractText(locale: string | undefined): string {
  return wizardProgressText(locale).flutterExtract;
}

function stripTrailingEta(line: string): string {
  return line
    .replace(/\s+\d+h\d+m\d+s$/i, "")
    .replace(/\s+\d+m\d+s$/i, "")
    .replace(/\s+\d+s$/i, "");
}

function sanitizeOutputLine(line: string): string {
  return line
    .replace(/^>>>\s+/g, "")
    .replace(/\s+[▕▏▎▍▌▋▊▉█]+\s+/g, " ")
    .replace(/\s+[▕▏▎▍▌▋▊▉█]+(?:\s+[▕▏▎▍▌▋▊▉█]+)*\s+/g, " ")
    .replace(/\s+\|\s+/g, " ")
    .trim();
}

function isSetupNoiseLine(line: string): boolean {
  const normalized = line.trim();

  return (
    /^>>> Downloading Ollama for /i.test(normalized) ||
    /^\d+(\.\d+)?%$/.test(normalized) ||
    /^#+$/.test(normalized) ||
    /^[#=\-O\s]+$/.test(normalized) ||
    /^#+\s+\d+(\.\d+)?%$/.test(normalized) ||
    /^\d+(\.\d+)?%\s+#+$/.test(normalized)
  );
}

function formatMegabytes(bytes: number): string {
  const megabytes = bytes / (1024 * 1024);
  return `${megabytes.toFixed(megabytes >= 100 ? 0 : 1)} MB`;
}
