import { runCommand } from "../../../node/process.js";
import type { MobileInstallableDevice, MobilePlatform } from "../types.js";

export function inspectFlutterDevices(flutterCommand = "flutter"): MobileInstallableDevice[] {
  const result = runCommand(flutterCommand, ["devices", "--machine"]);
  if (!result.ok || !result.stdout) {
    return [];
  }

  try {
    const devices = JSON.parse(result.stdout) as Array<{
      id?: string;
      name?: string;
      targetPlatform?: string;
      isSupported?: boolean;
      emulator?: boolean;
    }>;
    return devices.flatMap((device) => {
      if (device.isSupported === false || device.emulator === true) {
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
