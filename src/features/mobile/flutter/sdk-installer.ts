import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rename, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runCommandAsync } from "../../../node/process.js";
import type { FlutterMobileFeatureConfig, FlutterProgressEvent } from "../types.js";
import { extractArchive } from "./archive.js";
import { downloadArchive } from "./sdk-downloader.js";
import { firstLine } from "./utils.js";

export interface FlutterTool {
  ok: boolean;
  command: string;
  detail: string;
}

interface FlutterReleaseManifest {
  base_url: string;
  releases: Array<{
    channel: string;
    version: string;
    archive: string;
  }>;
}

export async function ensureFlutterTool(
  featureConfig: FlutterMobileFeatureConfig,
  onProgress?: (event: FlutterProgressEvent) => void | Promise<void>
): Promise<FlutterTool> {
  const configuredCommand = featureConfig.flutterCommand ?? "flutter";
  const managedCommand = managedFlutterCommand(featureConfig);
  if (existsSync(managedCommand)) {
    const managedCheck = await runCommandAsync(managedCommand, ["--version"]);
    if (managedCheck.ok) {
      await onProgress?.({ stage: "ready" });
      return {
        ok: true,
        command: managedCommand,
        detail: firstLine(managedCheck.stdout || managedCheck.stderr, "Managed Flutter is available.")
      };
    }
  }

  if (featureConfig.autoInstallSdk !== false) {
    try {
      await installManagedFlutter(featureConfig, onProgress);
      const installedCheck = await runCommandAsync(managedCommand, ["--version"]);
      await onProgress?.({ stage: "ready" });
      return {
        ok: installedCheck.ok,
        command: managedCommand,
        detail: installedCheck.ok
          ? firstLine(installedCheck.stdout || installedCheck.stderr, "Managed Flutter installed.")
          : (installedCheck.stderr || "Managed Flutter install completed, but Flutter is not ready.")
      };
    } catch (error) {
      return {
        ok: false,
        command: managedCommand,
        detail: error instanceof Error ? error.message : "Managed Flutter install failed."
      };
    }
  }

  const configuredCheck = await runCommandAsync(configuredCommand, ["--version"]);
  return {
    ok: configuredCheck.ok,
    command: configuredCommand,
    detail: configuredCheck.ok
      ? firstLine(configuredCheck.stdout || configuredCheck.stderr, "Flutter is available.")
      : (configuredCheck.stderr || "Flutter is not available. Enable mobile.flutter.autoInstallSdk or install Flutter.")
  };
}

async function installManagedFlutter(
  featureConfig: FlutterMobileFeatureConfig,
  onProgress?: (event: FlutterProgressEvent) => void | Promise<void>
): Promise<void> {
  const manifestUrl = flutterManifestUrl();
  if (!manifestUrl) {
    throw new Error("Current platform is not supported for automatic Flutter install.");
  }

  const response = await fetch(manifestUrl);
  if (!response.ok) {
    throw new Error(`Could not load Flutter release manifest (${response.status}).`);
  }

  const manifest = await response.json() as FlutterReleaseManifest;
  const sdkVersion = featureConfig.sdkVersion ?? "3.38.5";
  const release = manifest.releases.find((entry) => entry.channel === "stable" && entry.version === sdkVersion);
  if (!release) {
    throw new Error(`Could not find Flutter ${sdkVersion} in the official release archive.`);
  }

  const archiveUrl = `${manifest.base_url}/${release.archive}`;
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "pubwave-flutter-"));
  const archivePath = path.join(flutterDownloadsRoot(featureConfig), path.basename(release.archive));
  const extractDir = path.join(tempRoot, "extract");
  const installRoot = managedFlutterRoot(featureConfig);

  try {
    await mkdir(managedRuntimeRoot(featureConfig), { recursive: true });
    await mkdir(flutterDownloadsRoot(featureConfig), { recursive: true });
    await mkdir(path.dirname(installRoot), { recursive: true });
    await mkdir(extractDir, { recursive: true });
    await onProgress?.({ stage: "download", receivedBytes: 0 });
    await downloadArchive(archiveUrl, archivePath, onProgress);
    await rm(installRoot, { recursive: true, force: true });
    await onProgress?.({ stage: "extract" });
    await extractArchive(archivePath, extractDir);
    await rename(path.join(extractDir, "flutter"), installRoot);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}

function managedFlutterRoot(featureConfig: FlutterMobileFeatureConfig): string {
  return path.resolve(featureConfig.managedSdkDir ?? path.join(managedRuntimeRoot(featureConfig), "flutter-sdk"));
}

function managedFlutterCommand(featureConfig: FlutterMobileFeatureConfig): string {
  return path.join(managedFlutterRoot(featureConfig), "bin", os.platform() === "win32" ? "flutter.bat" : "flutter");
}

function managedRuntimeRoot(featureConfig: FlutterMobileFeatureConfig): string {
  return path.resolve(featureConfig.runtimeRoot ?? path.join(os.homedir(), ".pubwave-cli", "runtime"));
}

function flutterDownloadsRoot(featureConfig: FlutterMobileFeatureConfig): string {
  return path.join(managedRuntimeRoot(featureConfig), "downloads");
}

function flutterManifestUrl(): string | null {
  const base = "https://storage.googleapis.com/flutter_infra_release/releases";
  switch (os.platform()) {
    case "darwin":
      return `${base}/releases_macos.json`;
    case "linux":
      return `${base}/releases_linux.json`;
    case "win32":
      return `${base}/releases_windows.json`;
    default:
      return null;
  }
}
