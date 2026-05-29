import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, statSync } from "node:fs";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import {
  isJsonObject,
  jsonConfigHome,
  jsonConfigPath,
  loadJsonRaw,
  saveJsonConfigAtomic
} from "../../../src/core/config/io.js";
import type { CliConfigFactoryContext } from "../../../src/core/types.js";

const context: CliConfigFactoryContext = {
  app: {
    name: "T",
    command: "t",
    homeDirName: ".t",
    envPrefix: "IOTEST",
    version: "0.0.0",
    workspaceMarkers: []
  },
  paths: { projectRoot: "/proj", appHome: "/home/.t", runtimeRoot: "/home/.t/runtime" }
};

let tmpRoot: string;
beforeAll(() => { tmpRoot = mkdtempSync(path.join(tmpdir(), "pubwave-io-")); });
afterAll(() => {
  rmSync(tmpRoot, { recursive: true, force: true });
  delete process.env.IOTEST_HOME;
});

describe("isJsonObject", () => {
  it("accepts plain objects", () => {
    expect(isJsonObject({})).toBe(true);
    expect(isJsonObject({ a: 1 })).toBe(true);
  });

  it("rejects null, arrays, and primitives", () => {
    expect(isJsonObject(null)).toBe(false);
    expect(isJsonObject([])).toBe(false);
    expect(isJsonObject([1, 2])).toBe(false);
    expect(isJsonObject("x")).toBe(false);
    expect(isJsonObject(42)).toBe(false);
    expect(isJsonObject(undefined)).toBe(false);
  });
});

describe("jsonConfigHome", () => {
  beforeEach(() => { delete process.env.IOTEST_HOME; });

  it("env override wins (resolved to absolute)", () => {
    process.env.IOTEST_HOME = "/o";
    try {
      expect(jsonConfigHome(context, "user")).toBe(path.resolve("/o"));
    } finally {
      delete process.env.IOTEST_HOME;
    }
  });

  it("scope=project uses projectRoot/homeDirName when projectRoot is set", () => {
    expect(jsonConfigHome(context, "project")).toBe(path.join("/proj", ".t"));
  });

  it("scope=user uses homedir()/homeDirName", () => {
    expect(jsonConfigHome(context, "user")).toBe(path.join(homedir(), ".t"));
  });

  it("falls back to homedir() when scope=project but projectRoot is null", () => {
    const ctx = { ...context, paths: { ...context.paths, projectRoot: null } };
    expect(jsonConfigHome(ctx, "project")).toBe(path.join(homedir(), ".t"));
  });
});

describe("jsonConfigPath", () => {
  it("defaults to user/config.json", () => {
    expect(jsonConfigPath(context)).toBe(path.join(homedir(), ".t", "config.json"));
  });

  it("respects scope + fileName overrides", () => {
    expect(jsonConfigPath(context, { scope: "project", fileName: "settings.json" }))
      .toBe(path.join("/proj", ".t", "settings.json"));
  });
});

describe("loadJsonRaw", () => {
  it("returns null when the file is missing (ENOENT)", async () => {
    await expect(loadJsonRaw(path.join(tmpRoot, "absent.json"))).resolves.toBeNull();
  });

  it("reads and parses a valid JSON object", async () => {
    const file = path.join(tmpRoot, "ok.json");
    await writeFile(file, JSON.stringify({ language: "en", count: 3 }));
    await expect(loadJsonRaw(file)).resolves.toEqual({ language: "en", count: 3 });
  });

  it("throws on malformed JSON", async () => {
    const file = path.join(tmpRoot, "bad.json");
    await writeFile(file, "{ not json");
    await expect(loadJsonRaw(file)).rejects.toThrow();
  });

  it("throws when the JSON parses to a non-object (array, string, …)", async () => {
    const file = path.join(tmpRoot, "array.json");
    await writeFile(file, "[1, 2, 3]");
    await expect(loadJsonRaw(file)).rejects.toThrow(/must contain a JSON object/);
  });
});

describe("saveJsonConfigAtomic", () => {
  it("creates parent directories, writes pretty JSON with a trailing newline", async () => {
    const file = path.join(tmpRoot, "nested", "deeper", "config.json");
    await saveJsonConfigAtomic(file, { language: "en", ai: { provider: "openai" } });
    const content = await readFile(file, "utf8");
    expect(content.endsWith("\n")).toBe(true);
    expect(JSON.parse(content)).toEqual({ language: "en", ai: { provider: "openai" } });
    expect(content).toContain("  "); // pretty-printed with 2-space indent
  });

  it("writes with 0o600 permissions on POSIX platforms", async () => {
    const file = path.join(tmpRoot, "perms.json");
    await saveJsonConfigAtomic(file, { x: 1 });
    if (process.platform !== "win32") {
      const mode = statSync(file).mode & 0o777;
      expect(mode).toBe(0o600);
    }
  });

  it("does not leave the .tmp- temp file behind on success", async () => {
    const file = path.join(tmpRoot, "atomic.json");
    await saveJsonConfigAtomic(file, { x: 1 });
    const entries = await readdir(path.dirname(file));
    expect(entries.filter((e) => e.startsWith(".tmp-"))).toEqual([]);
  });

  it("overwrites an existing file atomically", async () => {
    const file = path.join(tmpRoot, "overwrite.json");
    await saveJsonConfigAtomic(file, { v: 1 });
    await saveJsonConfigAtomic(file, { v: 2 });
    expect(JSON.parse(await readFile(file, "utf8"))).toEqual({ v: 2 });
  });
});
