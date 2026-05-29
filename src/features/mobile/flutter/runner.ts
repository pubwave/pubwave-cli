import path from "node:path";
import { access } from "node:fs/promises";
import { runCommand, runCommandAsync, runInteractiveCommand } from "../../../node/process.js";
import type {
  DeviceRunResult,
  FlutterMobileFeatureConfig,
  MobileInstallableDevice,
  MobileRunInput,
  MobileRunResult
} from "../types.js";
import type { MobileWorkspace } from "../workspace.js";
import { inspectFlutterReadiness } from "./readiness.js";
import { ensureFlutterTool } from "./sdk-installer.js";

async function resolveMobileWorkspace(
  featureConfig: FlutterMobileFeatureConfig,
  input: MobileRunInput
): Promise<MobileWorkspace> {
  if (input.projectDir) {
    return { projectDir: path.resolve(input.projectDir) };
  }
  if (featureConfig.workspaceProvider && input.workspaceContext) {
    return await featureConfig.workspaceProvider.resolve(input.workspaceContext);
  }
  return { projectDir: path.resolve(featureConfig.projectDir ?? "apps/mobile") };
}

export async function runFlutterMobile(
  featureConfig: FlutterMobileFeatureConfig,
  input: MobileRunInput
): Promise<MobileRunResult> {
  const workspace = await resolveMobileWorkspace(featureConfig, input);
  const mobileDir = workspace.projectDir;
  const steps: MobileRunResult["steps"] = [];

  await input.callbacks?.onStep?.("mobile-project");
  try {
    await access(path.join(mobileDir, "pubspec.yaml"));
    steps.push({ label: "mobile-project", ok: true, detail: mobileDir });
  } catch {
    return {
      ok: false,
      steps: [{
        label: "mobile-project",
        ok: false,
        detail: `No Flutter project found at ${mobileDir}. Configure mobile.flutter.projectDir to the integrating project's Flutter app directory.`
      }],
      deviceResults: []
    };
  }

  await input.callbacks?.onStep?.("flutter");
  const tool = await ensureFlutterTool(featureConfig, input.callbacks?.onFlutterProgress);
  const activeFlutterCommand = input.flutterCommand ?? tool.command;
  if (!tool.ok) {
    steps.push({
      label: "flutter",
      ok: false,
      detail: tool.detail || "Flutter is not available."
    });
    return { ok: false, steps, deviceResults: [] };
  }

  const flutterVersion = runCommand(activeFlutterCommand, ["--version"], mobileDir);
  steps.push({
    label: "flutter",
    ok: flutterVersion.ok,
    detail: flutterVersion.ok ? "Flutter is available." : (flutterVersion.stderr || "Flutter is not available.")
  });
  if (!flutterVersion.ok) {
    return { ok: false, steps, deviceResults: [] };
  }

  await input.callbacks?.onStep?.("dependencies");
  const pubGet = await runCommandAsync(activeFlutterCommand, ["pub", "get"], mobileDir, {
    onStdout: (chunk) => input.callbacks?.onCommandOutput?.(chunk, "stdout"),
    onStderr: (chunk) => input.callbacks?.onCommandOutput?.(chunk, "stderr")
  });
  steps.push({
    label: "flutter pub get",
    ok: pubGet.ok,
    detail: pubGet.ok ? "Dependencies installed." : (pubGet.stderr || pubGet.stdout || "Dependency installation failed.")
  });
  if (!pubGet.ok) {
    return { ok: false, steps, deviceResults: [] };
  }

  const readiness = await inspectFlutterReadiness(
    { ...featureConfig, flutterCommand: activeFlutterCommand },
    input.platform,
    input.callbacks,
    { skipFlutterCheck: true }
  );
  steps.push(...readiness.steps.filter((step) => step.label !== "flutter"));
  if (!readiness.ok) {
    return { ok: false, steps, deviceResults: [] };
  }

  let selectedIdSet = input.selectedDeviceIds ? new Set(input.selectedDeviceIds) : null;
  if (!input.deviceId && !selectedIdSet && readiness.devices.length > 1 && input.selectDevices) {
    selectedIdSet = new Set(await input.selectDevices(readiness.devices));
  }
  const selectedDevices = input.deviceId
    ? readiness.devices.filter((device) => device.id === input.deviceId)
    : selectedIdSet
      ? readiness.devices.filter((device) => selectedIdSet.has(device.id))
      : readiness.devices;
  if (selectedDevices.length === 0) {
    steps.push({
      label: "device",
      ok: false,
      detail: input.deviceId ? `Device ${input.deviceId} is not available.` : "No matching mobile device is available."
    });
    return { ok: false, steps, deviceResults: [] };
  }

  steps.push({
    label: "device-selection",
    ok: true,
    detail: selectedDevices.length === 1
      ? `Using ${selectedDevices[0]!.label}.`
      : `Installing on ${selectedDevices.length} connected devices.`
  });
  await input.callbacks?.onStep?.("device-selection");

  const deviceResults = selectedDevices.length === 1 && input.interactive !== false
    ? [await runFlutterOnDevice(activeFlutterCommand, mobileDir, featureConfig, input, selectedDevices[0]!, false)]
    : await Promise.all(selectedDevices.map((device) =>
        runFlutterOnDevice(activeFlutterCommand, mobileDir, featureConfig, input, device, true)
      ));
  steps.push(...deviceResults.map((result) => ({
    label: result.label,
    ok: result.ok,
    detail: result.detail
  })));

  const finalResult: MobileRunResult = {
    ok: steps.every((step) => step.ok),
    steps,
    deviceResults
  };

  if (featureConfig.workspaceProvider?.cleanup) {
    await featureConfig.workspaceProvider.cleanup(workspace);
  }

  return finalResult;
}

async function runFlutterOnDevice(
  flutterCommand: string,
  mobileDir: string,
  featureConfig: FlutterMobileFeatureConfig,
  input: MobileRunInput,
  device: MobileInstallableDevice,
  asyncMode: boolean
): Promise<DeviceRunResult> {
  const runArgs = buildFlutterRunArgs({ ...input, deviceId: device.id }, featureConfig);
  await input.callbacks?.onStep?.("install-device", device);
  const runResult = asyncMode
    ? await runCommandAsync(flutterCommand, runArgs, mobileDir, {
        onStdout: (chunk) => input.callbacks?.onCommandOutput?.(chunk, "stdout", device),
        onStderr: (chunk) => input.callbacks?.onCommandOutput?.(chunk, "stderr", device)
      })
    : runInteractiveCommand(flutterCommand, runArgs, mobileDir);

  const result: DeviceRunResult = {
    device,
    label: [flutterCommand, ...runArgs].join(" "),
    ok: runResult.ok,
    detail: runResult.ok ? `${device.label}: Mobile app launched.` : (runResult.stderr || runResult.stdout || `${device.label}: Mobile launch failed.`)
  };
  await input.callbacks?.onDeviceComplete?.(result);
  return result;
}

function buildFlutterRunArgs(input: MobileRunInput, featureConfig: FlutterMobileFeatureConfig): string[] {
  const args = ["run"];
  if (featureConfig.releaseMode !== false) {
    args.push("--release");
  }
  if (input.deviceId) {
    args.push("-d", input.deviceId);
  }

  if (input.noResident) {
    args.push("--no-resident");
  }

  const dartDefines = resolveDartDefines(input, featureConfig);
  for (const [key, value] of Object.entries(dartDefines)) {
    args.push(`--dart-define=${key}=${value}`);
  }

  return args;
}

function resolveDartDefines(input: MobileRunInput, featureConfig: FlutterMobileFeatureConfig): Record<string, string> {
  const configured = typeof featureConfig.dartDefines === "function"
    ? featureConfig.dartDefines({ runtime: input.apiBaseUrl ? { apiBaseUrl: input.apiBaseUrl } : undefined })
    : featureConfig.dartDefines ?? {};

  return configured;
}
