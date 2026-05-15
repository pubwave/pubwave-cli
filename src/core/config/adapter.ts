import type { CliConfigAdapter, PubwaveCliConfig } from "../types.js";

export async function loadCliConfig<TProjectConfig>(
  adapter: CliConfigAdapter<TProjectConfig>
): Promise<{ projectConfig: TProjectConfig; cliConfig: PubwaveCliConfig }> {
  const projectConfig = await adapter.load();
  const cliConfig = adapter.toCliConfig
    ? await adapter.toCliConfig(projectConfig)
    : projectConfig as PubwaveCliConfig;

  return {
    projectConfig,
    cliConfig
  };
}

export async function saveCliConfig<TProjectConfig>(
  adapter: CliConfigAdapter<TProjectConfig>,
  cliConfig: PubwaveCliConfig
): Promise<void> {
  const projectConfig = await adapter.load();
  const nextProjectConfig = adapter.fromCliConfig
    ? await adapter.fromCliConfig(cliConfig, projectConfig)
    : cliConfig as TProjectConfig;

  await adapter.save(nextProjectConfig);
}
