import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { inspectFlutterReadiness } from "../../../../src/features/mobile/flutter/readiness.js";
import { runCommandAsync } from "../../../../src/node/process.js";
import { inspectFlutterDevices } from "../../../../src/features/mobile/flutter/devices.js";
import type { FlutterMobileFeatureConfig, MobileInstallableDevice } from "../../../../src/features/mobile/types.js";

vi.mock("../../../../src/node/process.js", () => ({
  runCommand: vi.fn(),
  runCommandAsync: vi.fn(),
  runInteractiveCommand: vi.fn()
}));
vi.mock("../../../../src/features/mobile/flutter/devices.js", () => ({
  inspectFlutterDevices: vi.fn(() => [])
}));

const mockRunAsync = vi.mocked(runCommandAsync);
const mockInspect = vi.mocked(inspectFlutterDevices);

const ok = (stdout = "v1") => ({ ok: true, exitCode: 0, stdout, stderr: "" });
const fail = (stderr = "missing") => ({ ok: false, exitCode: 1, stdout: "", stderr });

const cfg: FlutterMobileFeatureConfig = { projectDir: "apps/mobile", flutterCommand: "flutter" };
const android: MobileInstallableDevice = { id: "a", name: "Pixel", platform: "android", label: "Pixel (android)" };
const iphone: MobileInstallableDevice = { id: "i", name: "iPhone", platform: "ios", label: "iPhone (ios)" };

const originalPlatform = process.platform;

beforeEach(() => {
  mockRunAsync.mockResolvedValue(ok());
  mockInspect.mockReturnValue([]);
});

afterEach(() => {
  Object.defineProperty(process, "platform", { value: originalPlatform, configurable: true });
});

describe("inspectFlutterReadiness", () => {
  it("reports a 'device' failure when no devices are detected", async () => {
    const r = await inspectFlutterReadiness(cfg, undefined, undefined, { skipFlutterCheck: true });
    expect(r.ok).toBe(false);
    expect(r.steps.find((s) => s.label === "device")?.ok).toBe(false);
    expect(r.devices).toEqual([]);
  });

  it("checks adb (and only adb) when an android device is present", async () => {
    mockInspect.mockReturnValue([android]);
    const r = await inspectFlutterReadiness(cfg, undefined, undefined, { skipFlutterCheck: true });
    expect(r.steps.map((s) => s.label)).toEqual(["adb"]);
    expect(r.ok).toBe(true);
  });

  it("checks xcode + cocoapods for iOS on macOS hosts", async () => {
    Object.defineProperty(process, "platform", { value: "darwin", configurable: true });
    mockInspect.mockReturnValue([iphone]);
    const r = await inspectFlutterReadiness(cfg, undefined, undefined, { skipFlutterCheck: true });
    const labels = r.steps.map((s) => s.label);
    expect(labels).toContain("xcode");
    expect(labels).toContain("cocoapods");
    expect(labels).not.toContain("ios-host");
  });

  it("reports ios-host failure when iOS is requested off a non-macOS host", async () => {
    Object.defineProperty(process, "platform", { value: "linux", configurable: true });
    mockInspect.mockReturnValue([iphone]);
    const r = await inspectFlutterReadiness(cfg, undefined, undefined, { skipFlutterCheck: true });
    expect(r.steps.find((s) => s.label === "ios-host")?.ok).toBe(false);
    expect(r.ok).toBe(false);
  });

  it("reports failure when adb is not available", async () => {
    mockInspect.mockReturnValue([android]);
    mockRunAsync.mockResolvedValueOnce(fail("adb not found"));
    const r = await inspectFlutterReadiness(cfg, undefined, undefined, { skipFlutterCheck: true });
    expect(r.steps.find((s) => s.label === "adb")?.ok).toBe(false);
    expect(r.ok).toBe(false);
  });

  it("filters devices by requested platform", async () => {
    Object.defineProperty(process, "platform", { value: "darwin", configurable: true });
    mockInspect.mockReturnValue([android, iphone]);
    const r = await inspectFlutterReadiness(cfg, "android", undefined, { skipFlutterCheck: true });
    expect(r.devices.map((d) => d.id)).toEqual(["a"]);
    const labels = r.steps.map((s) => s.label);
    expect(labels).toContain("adb");
    expect(labels).not.toContain("xcode");
    expect(labels).not.toContain("cocoapods");
  });

  it("emits a platform-specific 'no device' detail when filtering by platform", async () => {
    mockInspect.mockReturnValue([android]);
    const r = await inspectFlutterReadiness(cfg, "ios", undefined, { skipFlutterCheck: true });
    expect(r.steps.find((s) => s.label === "device")?.detail).toMatch(/ios/i);
  });
});
