import { beforeEach, describe, expect, it, vi } from "vitest";
import { inspectFlutterDevices } from "../../../../src/features/mobile/flutter/devices.js";
import { runCommand } from "../../../../src/node/process.js";

vi.mock("../../../../src/node/process.js", () => ({
  runCommand: vi.fn(),
  runCommandAsync: vi.fn()
}));

const mockRunCommand = vi.mocked(runCommand);

function ok(stdout: string) {
  return { ok: true, exitCode: 0, stdout, stderr: "" };
}

const phone = { id: "abc", name: "Pixel 9", targetPlatform: "android-arm64", isSupported: true, emulator: false };
const simulator = { id: "sim", name: "iPhone 15 Sim", targetPlatform: "ios", isSupported: true, emulator: true };

beforeEach(() => {
  mockRunCommand.mockReturnValue(ok(JSON.stringify([phone, simulator])));
});

describe("inspectFlutterDevices — physicalDevicesOnly (Fix #1)", () => {
  it("drops emulators by default (physicalDevicesOnly=true)", () => {
    const devices = inspectFlutterDevices("flutter");
    expect(devices.map((d) => d.id)).toEqual(["abc"]);
  });

  it("keeps emulators when physicalDevicesOnly=false", () => {
    const devices = inspectFlutterDevices("flutter", false);
    expect(devices.map((d) => d.id).sort()).toEqual(["abc", "sim"]);
  });

  it("still drops unsupported devices even when emulators are allowed", () => {
    mockRunCommand.mockReturnValue(ok(JSON.stringify([{ ...simulator, isSupported: false }])));
    expect(inspectFlutterDevices("flutter", false)).toEqual([]);
  });
});

describe("inspectFlutterDevices — JSON parse hardening (Fix #3)", () => {
  it("parses through a leading non-JSON banner (first-run analytics, update notice)", () => {
    const banner = "Resolving dependencies...\nFlutter has a new version available!\n";
    mockRunCommand.mockReturnValue(ok(`${banner}${JSON.stringify([phone])}\n`));
    expect(inspectFlutterDevices("flutter").map((d) => d.id)).toEqual(["abc"]);
  });

  it("parses through trailing junk after the JSON array", () => {
    mockRunCommand.mockReturnValue(ok(`${JSON.stringify([phone])}\n\nDone.`));
    expect(inspectFlutterDevices("flutter").map((d) => d.id)).toEqual(["abc"]);
  });

  it("returns [] when no JSON array is present at all", () => {
    mockRunCommand.mockReturnValue(ok("Resolving dependencies...\nNo devices."));
    expect(inspectFlutterDevices("flutter")).toEqual([]);
  });

  it("returns [] when runCommand fails", () => {
    mockRunCommand.mockReturnValue({ ok: false, exitCode: 1, stdout: "", stderr: "no flutter" });
    expect(inspectFlutterDevices("flutter")).toEqual([]);
  });

  it("returns [] when JSON inside the brackets is malformed", () => {
    mockRunCommand.mockReturnValue(ok("[ this is not, valid json ]"));
    expect(inspectFlutterDevices("flutter")).toEqual([]);
  });
});

describe("inspectFlutterDevices — platform inference", () => {
  it("infers android from targetPlatform containing 'android'", () => {
    expect(inspectFlutterDevices("flutter").find((d) => d.id === "abc")?.platform).toBe("android");
  });

  it("infers ios from targetPlatform starting with 'ios'", () => {
    mockRunCommand.mockReturnValue(ok(JSON.stringify([{ ...phone, id: "iphone", targetPlatform: "ios-arm64", emulator: false }])));
    expect(inspectFlutterDevices("flutter")[0]!.platform).toBe("ios");
  });

  it("drops devices with unknown platforms", () => {
    mockRunCommand.mockReturnValue(ok(JSON.stringify([{ ...phone, targetPlatform: "fuchsia-x64" }])));
    expect(inspectFlutterDevices("flutter")).toEqual([]);
  });
});
