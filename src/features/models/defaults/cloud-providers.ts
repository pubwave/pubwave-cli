import type { CloudModelProvider } from "../types.js";

export const defaultCloudModelProviders: CloudModelProvider[] = [
  {
    label: "OpenAI",
    value: "openai",
    description: "Hosted default with broad model support.",
    models: [
      { label: "GPT-5.2", value: "gpt-5.2" },
      { label: "GPT-5.2 Pro", value: "gpt-5.2-pro" },
      { label: "GPT-5.2 Codex", value: "gpt-5.2-codex" },
      { label: "GPT-5.2 Chat", value: "gpt-5.2-chat-latest" },
      { label: "GPT-5", value: "gpt-5" },
      { label: "GPT-5 Mini", value: "gpt-5-mini" },
      { label: "GPT-5 Nano", value: "gpt-5-nano" },
      { label: "GPT-4.1", value: "gpt-4.1" },
      { label: "GPT-4.1 Mini", value: "gpt-4.1-mini" },
      { label: "GPT-4o Mini", value: "gpt-4o-mini" }
    ]
  },
  {
    label: "Anthropic",
    value: "anthropic",
    description: "Hosted Claude models.",
    models: [
      { label: "Claude Opus 4.1", value: "claude-opus-4-1" },
      { label: "Claude Opus 4.1 (20250805)", value: "claude-opus-4-1-20250805" },
      { label: "Claude Opus 4", value: "claude-opus-4-0" },
      { label: "Claude Opus 4 (20250514)", value: "claude-opus-4-20250514" },
      { label: "Claude Sonnet 4", value: "claude-sonnet-4-0" },
      { label: "Claude Sonnet 4 (20250514)", value: "claude-sonnet-4-20250514" },
      { label: "Claude Sonnet 3.7", value: "claude-3-7-sonnet-latest" },
      { label: "Claude Sonnet 3.7 (20250219)", value: "claude-3-7-sonnet-20250219" },
      { label: "Claude 3.5 Sonnet", value: "claude-3-5-sonnet-latest" },
      { label: "Claude 3.5 Haiku", value: "claude-3-5-haiku-latest" }
    ]
  },
  {
    label: "Google",
    value: "google",
    models: [
      { label: "Gemini 2.5 Pro", value: "gemini-2.5-pro" },
      { label: "Gemini 2.5 Flash", value: "gemini-2.5-flash" },
      { label: "Gemini 2.5 Flash-Lite", value: "gemini-2.5-flash-lite" },
      { label: "Gemini 2.5 Pro Preview TTS", value: "gemini-2.5-pro-preview-tts" },
      { label: "Gemini 2.5 Flash Preview TTS", value: "gemini-2.5-flash-preview-tts" },
      { label: "Gemini 2.5 Flash Native Audio", value: "gemini-2.5-flash-preview-native-audio-dialog" },
      { label: "Gemini 2.0 Flash", value: "gemini-2.0-flash" },
      { label: "Gemini 2.0 Flash-Lite", value: "gemini-2.0-flash-lite" },
      { label: "Gemini 1.5 Pro", value: "gemini-1.5-pro" },
      { label: "Gemini 1.5 Flash", value: "gemini-1.5-flash" }
    ]
  },
  {
    label: "Meta",
    value: "meta",
    models: [
      { label: "Llama 4 Maverick", value: "Llama-4-Maverick-17B-128E-Instruct-FP8" },
      { label: "Llama 4 Scout", value: "Llama-4-Scout-17B-16E-Instruct" },
      { label: "Llama 3.3 70B Instruct", value: "Llama-3.3-70B-Instruct" },
      { label: "Llama 3.2 90B Vision", value: "Llama-3.2-90B-Vision-Instruct" },
      { label: "Llama 3.2 11B Vision", value: "Llama-3.2-11B-Vision-Instruct" },
      { label: "Llama 3.1 405B Instruct", value: "Llama-3.1-405B-Instruct" },
      { label: "Llama 3.1 70B Instruct", value: "Llama-3.1-70B-Instruct" },
      { label: "Llama 3.1 8B Instruct", value: "Llama-3.1-8B-Instruct" },
      { label: "Llama 3.3 8B Instruct", value: "Llama-3.3-8B-Instruct" },
      { label: "Llama Guard 4 12B", value: "Llama-Guard-4-12B" }
    ]
  },
  {
    label: "xAI",
    value: "xai",
    models: [
      { label: "Grok 4", value: "grok-4" },
      { label: "Grok 4 Latest", value: "grok-4-latest" },
      { label: "Grok 4 Fast", value: "grok-4-fast" },
      { label: "Grok 4 Fast Reasoning", value: "grok-4-fast-reasoning" },
      { label: "Grok 4 Fast Non-Reasoning", value: "grok-4-fast-non-reasoning" },
      { label: "Grok 4.20", value: "grok-4-20" },
      { label: "Grok 3", value: "grok-3" },
      { label: "Grok 3 Mini", value: "grok-3-mini" },
      { label: "Grok Code Fast 1", value: "grok-code-fast-1" },
      { label: "Grok Vision Beta", value: "grok-vision-beta" }
    ]
  },
  {
    label: "Mistral",
    value: "mistral",
    models: [
      { label: "Mistral Medium 3.1", value: "mistral-medium-2508" },
      { label: "Mistral Small 3.2", value: "mistral-small-2506" },
      { label: "Magistral Medium", value: "magistral-medium-2507" },
      { label: "Magistral Small", value: "magistral-small-2507" },
      { label: "Codestral 25.08", value: "codestral-2508" },
      { label: "Devstral Medium", value: "devstral-medium-2507" },
      { label: "Mistral Saba", value: "mistral-saba-2502" },
      { label: "Pixtral Large", value: "pixtral-large-2411" },
      { label: "Pixtral 12B", value: "pixtral-12b-2409" },
      { label: "Ministral 8B", value: "ministral-8b-2410" }
    ]
  },
  {
    label: "Alibaba",
    value: "alibaba",
    models: [
      { label: "Qwen Max", value: "qwen-max" },
      { label: "Qwen Plus", value: "qwen-plus" },
      { label: "Qwen Turbo", value: "qwen-turbo" },
      { label: "Qwen Long", value: "qwen-long" },
      { label: "Qwen3 235B A22B Instruct 2507", value: "qwen3-235b-a22b-instruct-2507" },
      { label: "Qwen3 235B A22B Thinking 2507", value: "qwen3-235b-a22b-thinking-2507" },
      { label: "Qwen3 Coder 480B A35B Instruct", value: "qwen3-coder-480b-a35b-instruct" },
      { label: "Qwen2.5 72B Instruct", value: "qwen2.5-72b-instruct" },
      { label: "Qwen2.5 32B Instruct", value: "qwen2.5-32b-instruct" },
      { label: "Qwen2.5 14B Instruct", value: "qwen2.5-14b-instruct" }
    ]
  },
  {
    label: "ByteDance",
    value: "bytedance",
    models: [
      { label: "Doubao Seed 1.6", value: "doubao-seed-1.6" },
      { label: "Doubao Seed 1.6 Thinking", value: "doubao-seed-1.6-thinking" },
      { label: "Doubao 1.5 Thinking Pro", value: "doubao-1.5-thinking-pro" },
      { label: "Doubao 1.5 Pro 256K", value: "doubao-1.5-pro-256k" },
      { label: "Doubao 1.5 Pro 32K", value: "doubao-1.5-pro-32k" },
      { label: "Doubao 1.5 Lite 32K", value: "doubao-1.5-lite-32k" },
      { label: "Doubao 1.5 Vision Pro 32K", value: "doubao-1.5-vision-pro-32k" },
      { label: "Doubao 1.5 UI TARS", value: "doubao-1.5-ui-tars" },
      { label: "Doubao Seed Code", value: "doubao-seed-code" },
      { label: "Doubao Seed 1.5", value: "doubao-seed-1.5" }
    ]
  },
  {
    label: "DeepSeek",
    value: "deepseek",
    models: [
      { label: "DeepSeek V3.2 Exp", value: "deepseek-v3.2-exp" },
      { label: "DeepSeek V3.1", value: "deepseek-v3.1" },
      { label: "DeepSeek Chat", value: "deepseek-chat" },
      { label: "DeepSeek R1", value: "deepseek-reasoner" },
      { label: "DeepSeek R1 0528", value: "deepseek-r1-0528" },
      { label: "DeepSeek V3", value: "deepseek-v3" },
      { label: "DeepSeek V2.5", value: "deepseek-v2.5" },
      { label: "DeepSeek Coder V2", value: "deepseek-coder-v2" },
      { label: "DeepSeek Coder", value: "deepseek-coder" },
      { label: "DeepSeek R1 Lite Preview", value: "deepseek-r1-lite-preview" }
    ]
  },
  {
    label: "Zhipu",
    value: "zhipu",
    models: [
      { label: "GLM 4.7", value: "glm-4.7" },
      { label: "GLM 4.6", value: "glm-4.6" },
      { label: "GLM 4.5", value: "glm-4.5" },
      { label: "GLM 4.5 Air", value: "glm-4.5-air" },
      { label: "GLM 4.5 Flash", value: "glm-4.5-flash" },
      { label: "GLM 4.5V", value: "glm-4.5v" },
      { label: "GLM Z1 Air", value: "glm-z1-air" },
      { label: "GLM Z1 Flash", value: "glm-z1-flash" },
      { label: "GLM 4 Air 250414", value: "glm-4-air-250414" },
      { label: "CodeGeeX 4", value: "codegeex-4" }
    ]
  },
  {
    label: "MiniMax",
    value: "minimax",
    description: "Hosted MiniMax text models with strong coding and agent performance.",
    models: [
      { label: "MiniMax M2.7", value: "MiniMax-M2.7" },
      { label: "MiniMax M2.6", value: "MiniMax-M2.6" },
      { label: "MiniMax M2.5", value: "MiniMax-M2.5" },
      { label: "MiniMax M2.5 High Speed", value: "MiniMax-M2.5-highspeed" },
      { label: "MiniMax M1", value: "MiniMax-M1" },
      { label: "MiniMax Text 01", value: "MiniMax-Text-01" },
      { label: "MiniMax Text 01 Preview", value: "MiniMax-Text-01-preview" },
      { label: "MiniMax VL 01", value: "MiniMax-VL-01" },
      { label: "MiniMax Speech 02", value: "MiniMax-Speech-02" },
      { label: "MiniMax Music 01", value: "MiniMax-Music-01" }
    ]
  },
  {
    label: "Moonshot",
    value: "moonshot",
    models: [
      { label: "Kimi K2.5", value: "kimi-k2.5" },
      { label: "Kimi K2", value: "kimi-k2" },
      { label: "Kimi Thinking Preview", value: "kimi-thinking-preview" },
      { label: "Moonshot V1 128K", value: "moonshot-v1-128k" },
      { label: "Moonshot V1 32K", value: "moonshot-v1-32k" },
      { label: "Moonshot V1 8K", value: "moonshot-v1-8k" },
      { label: "Kimi Latest 8K", value: "kimi-latest-8k" },
      { label: "Kimi Latest 32K", value: "kimi-latest-32k" },
      { label: "Kimi Latest 128K", value: "kimi-latest-128k" },
      { label: "Kimi Vision Preview", value: "kimi-vision-preview" }
    ]
  },
  {
    label: "OpenRouter",
    value: "openrouter",
    description: "Hosted router across multiple providers.",
    models: [
      { label: "Qwen 3.6 Plus Preview (Free)", value: "qwen/qwen3.6-plus-preview:free" },
      { label: "KAT-Coder-Pro V2", value: "kwaipilot/kat-coder-pro-v2" },
      { label: "Reka Edge", value: "reka/reka-edge" },
      { label: "MiMo-V2-Omni", value: "xiaomi/mimo-v2-omni" },
      { label: "MiMo-V2-Pro", value: "xiaomi/mimo-v2-pro" },
      { label: "MiniMax M2.7", value: "minimax/minimax-m2.7" },
      { label: "GPT-5.4 Nano", value: "openai/gpt-5.4-nano" },
      { label: "GPT-5.4 Mini", value: "openai/gpt-5.4-mini" },
      { label: "GPT-4o Mini", value: "openai/gpt-4o-mini" },
      { label: "Mistral Small 4", value: "mistralai/mistral-small-2603" },
      { label: "GLM 5 Turbo", value: "z-ai/glm-5-turbo" }
    ]
  }
];
