import os from "node:os";
import { runCommandAsync } from "../../../node/process.js";
import type {
  FlutterMobileFeatureConfig,
  MobilePlatform,
  MobileReadinessResult,
  MobileRunInput
} from "../types.js";
import { inspectFlutterDevices } from "./devices.js";
import { ensureFlutterTool } from "./sdk-installer.js";
import { firstLine } from "./utils.js";

export async function inspectFlutterReadiness(
  featureConfig: FlutterMobileFeatureConfig,
  platform?: MobilePlatform,
  callbacks?: MobileRunInput["callbacks"],
  options?: { skipFlutterCheck?: boolean }
): Promise<MobileReadinessResult> {
  const steps: MobileReadinessResult["steps"] = [];
  let flutterCommand = featureConfig.flutterCommand ?? "flutter";

  if (!options?.skipFlutterCheck) {
    await callbacks?.onStep?.("flutter");
    const tool = await ensureFlutterTool(featureConfig, callbacks?.onFlutterProgress);
    flutterCommand = tool.command;
    steps.push({
      label: "flutter",
      ok: tool.ok,
      detail: tool.detail
    });

    if (!tool.ok) {
      return { ok: false, steps, devices: [] };
    }
  }

  await callbacks?.onStep?.("devices");
  const devices = inspectFlutterDevices(flutterCommand, featureConfig.physicalDevicesOnly ?? true)
    .filter((device) => !platform || device.platform === platform);

  if (devices.length === 0) {
    steps.push({
      label: "device",
      ok: false,
      detail: platform ? `No ${platform} device found.` : "No installable mobile device found."
    });
  }

  const hasAndroid = devices.some((device) => device.platform === "android");
  const hasIos = devices.some((device) => device.platform === "ios");

  if (hasAndroid) {
    await callbacks?.onStep?.("android-tools");
    const adb = await runCommandAsync("adb", ["version"]);
    steps.push({
      label: "adb",
      ok: adb.ok,
      detail: adb.ok ? firstLine(adb.stdout || adb.stderr, "Android tools are ready.") : "Android platform tools are missing or not on PATH."
    });
  }

  if (hasIos) {
    await callbacks?.onStep?.("ios-tools");
    if (os.platform() !== "darwin") {
      steps.push({
        label: "ios-host",
        ok: false,
        detail: "iOS device installation requires macOS."
      });
    } else {
      const xcode = await runCommandAsync("xcodebuild", ["-version"]);
      const pods = await runCommandAsync("pod", ["--version"]);
      steps.push({
        label: "xcode",
        ok: xcode.ok,
        detail: xcode.ok ? firstLine(xcode.stdout || xcode.stderr, "Xcode is ready.") : "Xcode command line tools are missing."
      });
      steps.push({
        label: "cocoapods",
        ok: pods.ok,
        detail: pods.ok ? firstLine(pods.stdout || pods.stderr, "CocoaPods is ready.") : "CocoaPods is missing."
      });
    }
  }

  return {
    ok: steps.every((step) => step.ok),
    steps,
    devices
  };
}
