import type { CliCommandContext } from "../../../core/types.js";
import { runFlutterMobile } from "../../mobile/flutter/runner.js";
import type { DeviceRunResult, MobileInstallableDevice, MobileRunResult } from "../../mobile/types.js";
import { mobileWorkspaceContextFromCli } from "../../mobile/workspace.js";
import {
  buildFlutterDownloadProgressText,
  mobileFlutterExtractText,
  mobileProgressText
} from "../progress/output.js";
import type { ProgressLine, SetupState } from "../types.js";

export async function runSetupMobileInstall(
  context: CliCommandContext,
  state: SetupState,
  progress: {
    appendProgress: (text: string, color?: ProgressLine["color"], completedText?: string) => void;
    updateLastProgress: (text: string, color?: ProgressLine["color"], completedText?: string) => void;
    appendOutput: (text: string, stream: "stdout" | "stderr", device?: MobileInstallableDevice) => void;
    startDeviceInstall: (device: MobileInstallableDevice) => void;
    completeDeviceInstall: (result: DeviceRunResult) => void;
    selectDevices: (devices: MobileInstallableDevice[]) => Promise<string[]>;
  }
): Promise<MobileRunResult | null> {
  if (state.mobileInstall !== "install") {
    return null;
  }

  const flutter = context.features.mobile && context.features.mobile.flutter;
  if (!flutter || flutter === true) {
    return null;
  }

  return runFlutterMobile(flutter, {
    interactive: false,
    noResident: true,
    workspaceContext: mobileWorkspaceContextFromCli(context),
    selectDevices: progress.selectDevices,
    callbacks: {
      onStep(stage, device) {
        if (stage === "install-device" && device) {
          progress.startDeviceInstall(device);
          return;
        }
        progress.appendProgress(mobileProgressText(state.language, stage, device));
      },
      onFlutterProgress(event) {
        if (event.stage === "download") {
          progress.updateLastProgress(buildFlutterDownloadProgressText(state.language, event));
          return;
        }
        if (event.stage === "extract") {
          progress.appendProgress(mobileFlutterExtractText(state.language));
        }
      },
      onCommandOutput(chunk, stream, device) {
        progress.appendOutput(chunk, stream, device);
      },
      onDeviceComplete(result) {
        progress.completeDeviceInstall(result);
      }
    }
  });
}
