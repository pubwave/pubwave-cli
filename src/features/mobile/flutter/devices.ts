import { runCommand } from "../../../node/process.js";
import type { MobileInstallableDevice, MobilePlatform } from "../types.js";

export function inspectFlutterDevices(
  flutterCommand = "flutter",
  physicalDevicesOnly = true
): MobileInstallableDevice[] {
  const result = runCommand(flutterCommand, ["devices", "--machine"]);
  if (!result.ok || !result.stdout) {
    return [];
  }

  // `flutter devices --machine` can emit non-JSON lines before the array
  // (first-run analytics banner, update notices). Extract the bracketed array
  // so a leading banner doesn't make every device disappear.
  const payload = extractJsonArray(result.stdout);
  if (!payload) {
    return [];
  }

  try {
    const devices = JSON.parse(payload) as Array<{
      id?: string;
      name?: string;
      targetPlatform?: string;
      isSupported?: boolean;
      emulator?: boolean;
    }>;
    return devices.flatMap((device) => {
      if (device.isSupported === false) {
        return [];
      }
      if (physicalDevicesOnly && device.emulator === true) {
        return [];
      }

      const platform = inferPlatform(device.targetPlatform);
      if (!device.id || !platform) {
        return [];
      }

      return {
        id: device.id,
        name: device.name ?? device.id,
        platform,
        label: `${device.name ?? device.id} (${platform})`
      };
    });
  } catch {
    return [];
  }
}

function extractJsonArray(stdout: string): string | null {
  const start = stdout.indexOf("[");
  const end = stdout.lastIndexOf("]");
  if (start < 0 || end <= start) {
    return null;
  }
  return stdout.slice(start, end + 1);
}

function inferPlatform(targetPlatform: string | undefined): MobilePlatform | null {
  if (!targetPlatform) {
    return null;
  }

  if (targetPlatform.includes("android")) {
    return "android";
  }

  if (targetPlatform.startsWith("ios")) {
    return "ios";
  }

  return null;
}
