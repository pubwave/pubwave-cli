import type { CliConfigAdapter, CliConfigFactory, PubwaveCliConfig } from "../types.js";
import {
  isJsonObject,
  jsonConfigPath,
  loadJsonRaw,
  saveJsonConfigAtomic,
  type JsonConfigPathOptions
} from "./io.js";
import { deepMergePartial } from "./merge.js";

export interface ManagedJsonConfigOptions<TProjectConfig> extends JsonConfigPathOptions {
  defaults: TProjectConfig | (() => TProjectConfig);
  toCliConfig: (projectConfig: TProjectConfig) => PubwaveCliConfig | Promise<PubwaveCliConfig>;
  fromCliConfig: (
    cliConfig: PubwaveCliConfig,
    currentProjectConfig: TProjectConfig
  ) => Partial<TProjectConfig> | Promise<Partial<TProjectConfig>>;
  migrate?: (raw: Record<string, unknown>) => TProjectConfig | Promise<TProjectConfig>;
  validate?: (config: TProjectConfig) => void | Promise<void>;
}

export function managedJsonConfig<TProjectConfig>(
  options: ManagedJsonConfigOptions<TProjectConfig>
): CliConfigFactory<TProjectConfig> {
  return (context): CliConfigAdapter<TProjectConfig> => {
    const filePath = jsonConfigPath(context, options);

    async function resolveDefaults(): Promise<TProjectConfig> {
      return typeof options.defaults === "function"
        ? await (options.defaults as () => TProjectConfig | Promise<TProjectConfig>)()
        : options.defaults;
    }

    return {
      async load(): Promise<TProjectConfig> {
        const defaults = await resolveDefaults();
        const raw = await loadJsonRaw(filePath);
        const migrated = raw && options.migrate
          ? await options.migrate(raw)
          : raw && isJsonObject(raw)
            ? (raw as unknown as TProjectConfig)
            : defaults;
        const merged = deepMergePartial<TProjectConfig>(defaults, migrated as unknown);
        if (options.validate) {
          await options.validate(merged);
        }
        return merged;
      },
      async save(next: TProjectConfig): Promise<void> {
        if (options.validate) {
          await options.validate(next);
        }
        await saveJsonConfigAtomic(filePath, next);
      },
      toCliConfig: options.toCliConfig,
      fromCliConfig: async (cliConfig, current) => {
        const partial = await options.fromCliConfig(cliConfig, current);
        const merged = deepMergePartial<TProjectConfig>(current, partial as unknown);
        if (options.validate) {
          await options.validate(merged);
        }
        return merged;
      }
    };
  };
}
