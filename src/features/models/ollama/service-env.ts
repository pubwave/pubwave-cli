import type { LocalModelRuntime } from "../types.js";

/**
 * Returns the env vars that should be injected into server processes so they
 * can reach the local model runtime at the correct host.
 *
 * Pass the resolved LAN IP (not 127.0.0.1) so services can connect to the
 * local model from mobile devices and other processes on the same network.
 */
export function resolveLocalModelServiceEnv(
  host: string,
  runtime: LocalModelRuntime
): Record<string, string> {
  switch (runtime) {
    case "ollama":
      return { OLLAMA_HOST: host };
  }
}
