import path from "node:path";
import type { CliCommandContext, CliPathContext, NormalizedAppConfig } from "../../core/types.js";

export interface MobileWorkspaceResolveContext {
  app: NormalizedAppConfig;
  paths: CliPathContext;
  runtimeRoot: string;
}

export interface MobileWorkspace {
  projectDir: string;
}

export interface MobileWorkspaceProvider {
  resolve(ctx: MobileWorkspaceResolveContext): Promise<MobileWorkspace> | MobileWorkspace;
  cleanup?(workspace: MobileWorkspace): Promise<void> | void;
}

export interface LocalProjectDirOptions {
  projectDir?: string;
}

export function localProjectDir(options: LocalProjectDirOptions = {}): MobileWorkspaceProvider {
  return {
    resolve(ctx) {
      const projectDir = options.projectDir ?? "apps/mobile";
      const base = path.isAbsolute(projectDir)
        ? projectDir
        : path.resolve(ctx.paths.projectRoot ?? process.cwd(), projectDir);
      return { projectDir: base };
    }
  };
}

export function mobileWorkspaceContextFromCli(context: CliCommandContext): MobileWorkspaceResolveContext {
  return {
    app: context.app,
    paths: context.paths,
    runtimeRoot: context.paths.runtimeRoot
  };
}
