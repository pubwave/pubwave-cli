import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { managedJsonConfig } from "../../../src/core/config/managed-json-adapter.js";
import type { CliConfigFactoryContext } from "../../../src/core/types.js";

interface Project {
  name?: string;
  nested?: { a: number; b?: number };
}

let tmpRoot: string;

beforeAll(() => {
  tmpRoot = mkdtempSync(path.join(tmpdir(), "pubwave-managed-"));
  // Use the env override so jsonConfigHome resolves directly to tmpRoot,
  // skipping the homeDirName subdir for cleaner test paths.
  process.env.MANAGED_HOME = tmpRoot;
});

afterAll(() => {
  delete process.env.MANAGED_HOME;
  rmSync(tmpRoot, { recursive: true, force: true });
});

const ctx: CliConfigFactoryContext = {
  app: { name: "T", command: "t", homeDirName: ".t", envPrefix: "MANAGED", version: "0", workspaceMarkers: [] },
  paths: { projectRoot: null, appHome: tmpRoot, runtimeRoot: tmpRoot }
};

describe("managedJsonConfig — defaults", () => {
  it("returns defaults verbatim when the file is missing", async () => {
    const adapter = managedJsonConfig<Project>({
      fileName: "missing.json",
      defaults: { name: "fallback" },
      toCliConfig: () => ({}),
      fromCliConfig: () => ({})
    })(ctx);
    await expect(adapter.load()).resolves.toEqual({ name: "fallback" });
  });

  it("invokes a factory defaults function", async () => {
    const factory = vi.fn(() => ({ name: "from-factory" }));
    const adapter = managedJsonConfig<Project>({
      fileName: "factory.json",
      defaults: factory,
      toCliConfig: () => ({}),
      fromCliConfig: () => ({})
    })(ctx);
    expect(await adapter.load()).toEqual({ name: "from-factory" });
    expect(factory).toHaveBeenCalledOnce();
  });
});

describe("managedJsonConfig — load merging", () => {
  it("deep-merges the file content over defaults", async () => {
    const fileName = "merge.json";
    await writeFile(path.join(tmpRoot, fileName), JSON.stringify({ nested: { b: 9 } }));
    const adapter = managedJsonConfig<Project>({
      fileName,
      defaults: { name: "x", nested: { a: 1, b: 2 } },
      toCliConfig: () => ({}),
      fromCliConfig: () => ({})
    })(ctx);
    expect(await adapter.load()).toEqual({ name: "x", nested: { a: 1, b: 9 } });
  });

  it("runs the migrate hook when provided", async () => {
    const fileName = "migrate.json";
    await writeFile(path.join(tmpRoot, fileName), JSON.stringify({ legacy: "hello" }));
    const migrate = vi.fn(async (raw: Record<string, unknown>) => ({ name: `migrated-${(raw.legacy as string).length}` }));
    const adapter = managedJsonConfig<Project>({
      fileName,
      defaults: { name: "x" },
      migrate,
      toCliConfig: () => ({}),
      fromCliConfig: () => ({})
    })(ctx);
    expect((await adapter.load()).name).toBe("migrated-5");
    expect(migrate).toHaveBeenCalledOnce();
  });
});

describe("managedJsonConfig — validate hook", () => {
  it("runs validate on load", async () => {
    const validate = vi.fn();
    const adapter = managedJsonConfig<Project>({
      fileName: "v-load.json",
      defaults: { name: "x" },
      validate,
      toCliConfig: () => ({}),
      fromCliConfig: () => ({})
    })(ctx);
    await adapter.load();
    expect(validate).toHaveBeenCalledOnce();
  });

  it("runs validate on save (and propagates a rejection)", async () => {
    const validate = vi.fn((cfg: Project) => {
      if (cfg.name === "bad") throw new Error("nope");
    });
    const adapter = managedJsonConfig<Project>({
      fileName: "v-save.json",
      defaults: { name: "x" },
      validate,
      toCliConfig: () => ({}),
      fromCliConfig: () => ({})
    })(ctx);
    await expect(adapter.save({ name: "bad" })).rejects.toThrow("nope");
  });
});

describe("managedJsonConfig — save / round-trip", () => {
  it("save persists JSON readable by a subsequent load", async () => {
    const fileName = "roundtrip.json";
    const adapter = managedJsonConfig<Project>({
      fileName,
      defaults: { name: "default" },
      toCliConfig: () => ({}),
      fromCliConfig: () => ({})
    })(ctx);
    await adapter.save({ name: "saved", nested: { a: 7 } });
    const onDisk = JSON.parse(await readFile(path.join(tmpRoot, fileName), "utf8"));
    expect(onDisk).toEqual({ name: "saved", nested: { a: 7 } });
    expect(await adapter.load()).toEqual({ name: "saved", nested: { a: 7 } });
  });
});

describe("managedJsonConfig — toCliConfig / fromCliConfig", () => {
  it("forwards toCliConfig to the caller-provided mapper", async () => {
    const toCli = vi.fn(() => ({ language: "en" }));
    const adapter = managedJsonConfig<Project>({
      fileName: "tocli.json",
      defaults: { name: "x" },
      toCliConfig: toCli,
      fromCliConfig: () => ({})
    })(ctx);
    expect(await adapter.toCliConfig!({ name: "x" })).toEqual({ language: "en" });
    expect(toCli).toHaveBeenCalledOnce();
  });

  it("fromCliConfig deep-merges the host-returned partial into the current project config", async () => {
    const adapter = managedJsonConfig<Project>({
      fileName: "fromcli.json",
      defaults: { name: "x" },
      toCliConfig: () => ({}),
      fromCliConfig: async () => ({ nested: { a: 5 } })
    })(ctx);
    const merged = await adapter.fromCliConfig!({}, { name: "kept", nested: { a: 1, b: 2 } });
    expect(merged).toEqual({ name: "kept", nested: { a: 5, b: 2 } });
  });
});
