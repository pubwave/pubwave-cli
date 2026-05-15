import type { ModelChoice } from "../types.js";

export const defaultLocalModelChoices: ModelChoice[] = [
  {
    label: "qwen2.5:7b",
    value: "qwen2.5:7b",
    description: "Strong multilingual open-source default for local deployment.",
    group: "recommended"
  },
  {
    label: "qwen2.5:14b",
    value: "qwen2.5:14b",
    description: "Stronger general-purpose local Qwen when you can afford more memory.",
    group: "recommended"
  },
  {
    label: "qwen3:8b",
    value: "qwen3:8b",
    description: "Newer balanced Qwen option with stronger reasoning.",
    group: "recommended"
  },
  {
    label: "llama3.1:8b",
    value: "llama3.1:8b",
    description: "Balanced general local model with broad ecosystem support.",
    group: "more"
  },
  {
    label: "phi4:14b",
    value: "phi4:14b",
    description: "Compact but stronger Microsoft local model for reasoning and writing.",
    group: "more"
  },
  {
    label: "mistral-nemo:12b",
    value: "mistral-nemo:12b",
    description: "Solid midsize local model with a good speed-quality tradeoff.",
    group: "more"
  },
  {
    label: "gemma3:12b",
    value: "gemma3:12b",
    description: "Modern Gemma option with stronger overall quality than Gemma 2.",
    group: "more"
  }
];
