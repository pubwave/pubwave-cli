import type { CliConfigFactory, PubwaveCliConfig } from "../types.js";
import {
  jsonConfigHome,
  jsonConfigPath,
  loadJsonRaw,
  saveJsonConfigAtomic,
  type JsonConfigPathOptions
} from "./io.js";

export type JsonConfigOptions = JsonConfigPathOptions;

export function jsonConfig(options: JsonConfigOptions = {}): CliConfigFactory<PubwaveCliConfig> {
  return (context) => {
    const filePath = jsonConfigPath(context, options);

    return {
      async load() {
        const raw = await loadJsonRaw(filePath);
        return (raw ?? {}) as PubwaveCliConfig;
      },
      async save(config) {
        await saveJsonConfigAtomic(filePath, config);
      }
    };
  };
}

export { jsonConfigPath, jsonConfigHome };
