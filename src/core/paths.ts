import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { CliPathContext, CliAppConfig } from "./types.js";

export function resolveCliPaths(app: Required<CliAppConfig>): CliPathContext {
  const override = process.env[`${app.envPrefix}_HOME`]?.trim();
  if (override) {
    const appHome = path.resolve(override);
    return {
      projectRoot: null,
      appHome,
      runtimeRoot: path.join(appHome, "runtime")
    };
  }

  const projectRoot = resolveProjectRoot(app);
  const appHome = projectRoot
    ? path.join(projectRoot, app.homeDirName)
    : path.join(os.homedir(), app.homeDirName);

  return {
    projectRoot,
    appHome,
    runtimeRoot: path.join(appHome, "runtime")
  };
}

function resolveProjectRoot(app: Required<CliAppConfig>): string | null {
  return findAncestorWithMarkers(process.cwd(), app.workspaceMarkers);
}

function findAncestorWithMarkers(startDir: string, markers: string[]): string | null {
  let currentDir = startDir;

  while (true) {
    if (markers.every((marker) => existsSync(path.join(currentDir, marker)))) {
      return currentDir;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return null;
    }

    currentDir = parentDir;
  }
}
