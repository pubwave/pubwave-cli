import { describe, expect, it } from "vitest";
import path from "node:path";
import {
  localProjectDir,
  mobileWorkspaceContextFromCli,
  type MobileWorkspaceResolveContext
} from "../../../src/features/mobile/workspace.js";
import type { CliCommandContext } from "../../../src/core/types.js";

function ctx(projectRoot: string | null): MobileWorkspaceResolveContext {
  return {
    app: { name: "T", command: "t", homeDirName: ".t", envPrefix: "T", version: "0", workspaceMarkers: ["package.json"] },
    paths: { projectRoot, appHome: "/home/.t", runtimeRoot: "/home/.t/runtime" },
    runtimeRoot: "/home/.t/runtime"
  };
}

describe("localProjectDir", () => {
  it("returns an absolute projectDir unchanged", () => {
    const workspace = localProjectDir({ projectDir: "/abs/path/to/app" }).resolve(ctx("/repo"));
    expect(workspace.projectDir).toBe("/abs/path/to/app");
  });

  it("joins a relative projectDir to projectRoot when set", () => {
    const workspace = localProjectDir({ projectDir: "apps/mobile" }).resolve(ctx("/repo"));
    expect(workspace.projectDir).toBe(path.resolve("/repo", "apps/mobile"));
  });

  it("defaults to apps/mobile under projectRoot", () => {
    const workspace = localProjectDir().resolve(ctx("/repo"));
    expect(workspace.projectDir).toBe(path.resolve("/repo", "apps/mobile"));
  });

  it("falls back to process.cwd() when projectRoot is null", () => {
    const workspace = localProjectDir({ projectDir: "mobile" }).resolve(ctx(null));
    expect(workspace.projectDir).toBe(path.resolve(process.cwd(), "mobile"));
  });
});

describe("mobileWorkspaceContextFromCli", () => {
  it("projects the CLI context into a workspace-resolve context", () => {
    const cliCtx = {
      app: { name: "X", command: "x" },
      paths: { projectRoot: "/r", appHome: "/h", runtimeRoot: "/h/runtime" }
    } as unknown as CliCommandContext;
    const result = mobileWorkspaceContextFromCli(cliCtx);
    expect(result).toEqual({ app: cliCtx.app, paths: cliCtx.paths, runtimeRoot: "/h/runtime" });
  });
});
