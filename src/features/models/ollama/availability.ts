import { runCommand, runCommandAsync } from "../../../node/process.js";
import type { ModelChoice } from "../types.js";
import { resolveOllamaExecutable } from "./runtime/index.js";

export function isOllamaAvailable(): boolean {
  const executable = resolveOllamaExecutable();
  return executable ? runCommand(executable, ["--version"]).ok : false;
}

export function installedOllamaModels(): ModelChoice[] {
  const executable = resolveOllamaExecutable();
  if (!executable) {
    return [];
  }

  const result = runCommand(executable, ["list"]);
  if (!result.ok || !result.stdout) {
    return [];
  }

  return parseInstalledOllamaModels(result.stdout);
}

export async function installedOllamaModelsAsync(): Promise<ModelChoice[]> {
  const executable = resolveOllamaExecutable();
  if (!executable) {
    return [];
  }

  const result = await runCommandAsync(executable, ["list"]);
  if (!result.ok || !result.stdout) {
    return [];
  }

  return parseInstalledOllamaModels(result.stdout);
}

export function isOllamaModelInstalled(model: string): boolean {
  const target = normalizeOllamaModelName(model);
  return installedOllamaModels().some((choice) => normalizeOllamaModelName(choice.value) === target);
}

export async function isOllamaModelInstalledAsync(model: string): Promise<boolean> {
  const target = normalizeOllamaModelName(model);
  const installed = await installedOllamaModelsAsync();
  return installed.some((choice) => normalizeOllamaModelName(choice.value) === target);
}

// Ollama stores an untagged pull (e.g. `llama3`) as `llama3:latest`, and
// `ollama list` reports the tagged form. Normalize so a configured value
// without an explicit tag matches the installed entry instead of re-pulling.
function normalizeOllamaModelName(model: string): string {
  return model.includes(":") ? model : `${model}:latest`;
}

export function availableOllamaModelChoices(recommendedChoices: ModelChoice[]): ModelChoice[] {
  const installedModels = installedOllamaModels();
  return mergeInstalledOllamaModelChoices(recommendedChoices, installedModels);
}

export async function availableOllamaModelChoicesAsync(recommendedChoices: ModelChoice[]): Promise<ModelChoice[]> {
  const installedModels = await installedOllamaModelsAsync();
  return mergeInstalledOllamaModelChoices(recommendedChoices, installedModels);
}

function mergeInstalledOllamaModelChoices(recommendedChoices: ModelChoice[], installedModels: ModelChoice[]): ModelChoice[] {
  if (installedModels.length === 0) {
    return recommendedChoices;
  }

  const recommendedByValue = new Map(recommendedChoices.map((choice) => [normalizeOllamaModelName(choice.value), choice]));
  const installedChoices = installedModels.map((model) => ({
    ...(recommendedByValue.get(normalizeOllamaModelName(model.value)) ?? model),
    label: `${model.value} (Installed)`,
    value: model.value,
    description: "Already installed in local Ollama.",
    group: "installed" as const
  }));
  const installedValues = new Set(installedChoices.map((choice) => normalizeOllamaModelName(choice.value)));
  const remainingChoices = recommendedChoices.filter((choice) => !installedValues.has(normalizeOllamaModelName(choice.value)));

  return [...installedChoices, ...remainingChoices];
}

function parseInstalledOllamaModels(stdout: string): ModelChoice[] {
  return stdout
    .split("\n")
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      const [modelName] = line.split(/\s+/);
      return modelName ? [{ label: `${modelName} (Installed)`, value: modelName }] : [];
    });
}
