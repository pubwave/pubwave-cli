import type { FlutterMobileFeatureConfig } from "../types.js";
import { localProjectDir } from "../workspace.js";

export function normalizeFlutterConfig(
  input: boolean | FlutterMobileFeatureConfig | undefined
): FlutterMobileFeatureConfig | false {
  if (!input) {
    return false;
  }

  if (input === true) {
    return {
      projectDir: "apps/mobile",
      flutterCommand: "flutter",
      autoInstallSdk: true,
      workspaceProvider: localProjectDir({ projectDir: "apps/mobile" })
    };
  }

  const projectDir = input.projectDir ?? "apps/mobile";
  return {
    projectDir,
    flutterCommand: input.flutterCommand ?? "flutter",
    releaseMode: input.releaseMode ?? true,
    physicalDevicesOnly: input.physicalDevicesOnly ?? true,
    autoInstallSdk: input.autoInstallSdk ?? true,
    managedSdkDir: input.managedSdkDir,
    runtimeRoot: input.runtimeRoot,
    sdkVersion: input.sdkVersion ?? "3.38.5",
    workspaceProvider: input.workspaceProvider ?? localProjectDir({ projectDir }),
    ...(input.dartDefines ? { dartDefines: input.dartDefines } : {})
  };
}
