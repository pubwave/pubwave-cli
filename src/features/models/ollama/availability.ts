import { runCommand, runCommandAsync } from "../../../node/process.js";
import type { ModelChoice } from "../types.js";

export function isOllamaAvailable(): boolean {
  return runCommand("ollama", ["--version"]).ok;
}

export function installedOllamaModels(): ModelChoice[] {
  const result = runCommand("ollama", ["list"]);
  if (!result.ok || !result.stdout) {
    return [];
  }

  return parseInstalledOllamaModels(result.stdout);
}

export async function installedOllamaModelsAsync(): Promise<ModelChoice[]> {
  const result = await runCommandAsync("ollama", ["list"]);
  if (!result.ok || !result.stdout) {
    return [];
  }

  return parseInstalledOllamaModels(result.stdout);
}

export function isOllamaModelInstalled(model: string): boolean {
  return installedOllamaModels().some((choice) => choice.value === model);
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

  const recommendedByValue = new Map(recommendedChoices.map((choice) => [choice.value, choice]));
  const installedChoices = installedModels.map((model) => ({
    ...(recommendedByValue.get(model.value) ?? model),
    label: `${model.value} (Installed)`,
    value: model.value,
    description: "Already installed in local Ollama.",
    group: "installed" as const
  }));
  const installedValues = new Set(installedChoices.map((choice) => choice.value));
  const remainingChoices = recommendedChoices.filter((choice) => !installedValues.has(choice.value));

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
