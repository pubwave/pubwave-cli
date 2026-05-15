import type { CliCommandContext } from "../../../core/types.js";

export function openXcodeWorkspace(projectDir: string | undefined): void {
  if (!projectDir || process.platform !== "darwin") {
    return;
  }
  const workspace = `${projectDir.replace(/\/$/, "")}/ios/Runner.xcworkspace`;
  void import("node:child_process").then(({ spawn }) => {
    spawn("open", ["-a", "Xcode", workspace], { detached: true, stdio: "ignore" }).unref();
  });
}

export function mobileProjectDir(context: CliCommandContext): string | undefined {
  const flutter = context.features.mobile && context.features.mobile.flutter;
  return flutter && flutter !== true ? flutter.projectDir : undefined;
}

export function openMacAppStoreXcode(): void {
  if (process.platform !== "darwin") {
    return;
  }
  void import("node:child_process").then(({ spawn }) => {
    spawn("open", ["macappstore://itunes.apple.com/app/id497799835"], { detached: true, stdio: "ignore" }).unref();
  });
}
