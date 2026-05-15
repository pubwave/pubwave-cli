import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { CliConfigFactoryContext } from "../types.js";

export interface JsonConfigPathOptions {
  scope?: "user" | "project";
  fileName?: string;
}

export function jsonConfigHome(context: CliConfigFactoryContext, scope: "user" | "project"): string {
  const override = process.env[`${context.app.envPrefix}_HOME`]?.trim();
  if (override) {
    return path.resolve(override);
  }

  if (scope === "project" && context.paths.projectRoot) {
    return path.join(context.paths.projectRoot, context.app.homeDirName);
  }

  return path.join(os.homedir(), context.app.homeDirName);
}

export function jsonConfigPath(context: CliConfigFactoryContext, options: JsonConfigPathOptions = {}): string {
  return path.join(jsonConfigHome(context, options.scope ?? "user"), options.fileName ?? "config.json");
}

export async function loadJsonRaw(filePath: string): Promise<Record<string, unknown> | null> {
  try {
    const content = await readFile(filePath, "utf8");
    const parsed = JSON.parse(content) as unknown;
    if (!isJsonObject(parsed)) {
      throw new Error(`Config file must contain a JSON object: ${filePath}`);
    }
    return parsed;
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export async function saveJsonConfigAtomic(filePath: string, payload: unknown): Promise<void> {
  const directory = path.dirname(filePath);
  await mkdir(directory, { recursive: true });

  const tempFile = path.join(directory, `.tmp-${path.basename(filePath)}-${process.pid}-${Date.now()}`);
  const content = `${JSON.stringify(payload, null, 2)}\n`;
  await writeFile(tempFile, content, { mode: 0o600 });
  await rename(tempFile, filePath);
}

export function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
