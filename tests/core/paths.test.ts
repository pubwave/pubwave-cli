import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import { resolveCliPaths } from "../../src/core/paths.js";
import type { CliAppConfig } from "../../src/core/types.js";

const app: Required<CliAppConfig> = {
  name: "Test",
  command: "testapp",
  homeDirName: ".testapp",
  envPrefix: "TESTAPP",
  version: "0.0.0",
  workspaceMarkers: ["package.json"]
};

let tmpRoot: string;

beforeAll(() => {
  tmpRoot = mkdtempSync(path.join(tmpdir(), "pubwave-paths-"));
});

afterAll(() => {
  rmSync(tmpRoot, { recursive: true, force: true });
  delete process.env.TESTAPP_HOME;
});

describe("resolveCliPaths", () => {
  it("env override wins over every other source", () => {
    process.env.TESTAPP_HOME = "/some/override";
    try {
      const paths = resolveCliPaths(app);
      expect(paths.appHome).toBe(path.resolve("/some/override"));
      expect(paths.projectRoot).toBeNull();
      expect(paths.runtimeRoot).toBe(path.join(paths.appHome, "runtime"));
    } finally {
      delete process.env.TESTAPP_HOME;
    }
  });

  it("trims whitespace-only env override (treated as unset)", () => {
    process.env.TESTAPP_HOME = "   ";
    const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(tmpRoot);
    try {
      const paths = resolveCliPaths(app);
      expect(paths.appHome).not.toBe(path.resolve("   "));
    } finally {
      cwdSpy.mockRestore();
      delete process.env.TESTAPP_HOME;
    }
  });

  it("locates projectRoot from the cwd when the marker is present", () => {
    const projectRoot = path.join(tmpRoot, "proj");
    mkdirSync(projectRoot, { recursive: true });
    writeFileSync(path.join(projectRoot, "package.json"), "{}");
    const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(projectRoot);
    try {
      const paths = resolveCliPaths(app);
      expect(paths.projectRoot).toBe(projectRoot);
      expect(paths.appHome).toBe(path.join(projectRoot, ".testapp"));
      expect(paths.runtimeRoot).toBe(path.join(projectRoot, ".testapp", "runtime"));
    } finally {
      cwdSpy.mockRestore();
    }
  });

  it("walks ancestors to find the marker", () => {
    const projectRoot = path.join(tmpRoot, "walk");
    const deep = path.join(projectRoot, "a", "b", "c");
    mkdirSync(deep, { recursive: true });
    writeFileSync(path.join(projectRoot, "package.json"), "{}");
    const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(deep);
    try {
      expect(resolveCliPaths(app).projectRoot).toBe(projectRoot);
    } finally {
      cwdSpy.mockRestore();
    }
  });

  it("falls back to homedir/.app when no marker is found in any ancestor", () => {
    const empty = path.join(tmpRoot, "empty");
    mkdirSync(empty, { recursive: true });
    const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(empty);
    try {
      const paths = resolveCliPaths(app);
      expect(paths.projectRoot).toBeNull();
      expect(paths.appHome).toBe(path.join(homedir(), ".testapp"));
    } finally {
      cwdSpy.mockRestore();
    }
  });

  it("requires every marker to be present (intersection, not union)", () => {
    const partial = path.join(tmpRoot, "partial");
    mkdirSync(partial, { recursive: true });
    writeFileSync(path.join(partial, "package.json"), "{}");
    // pubspec.yaml is missing → should NOT match
    const twoMarkerApp: Required<CliAppConfig> = { ...app, workspaceMarkers: ["package.json", "pubspec.yaml"] };
    const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(partial);
    try {
      expect(resolveCliPaths(twoMarkerApp).projectRoot).toBeNull();
    } finally {
      cwdSpy.mockRestore();
    }
  });
});
