import type { MobileRunResult } from "../../mobile/types.js";
import type { WizardLocale } from "../../../shared/i18n/wizard/index.js";
import {
  errorTextCatalog,
  mobileRetryTextCatalog,
  type MobileRetryGuideKind
} from "../../../shared/i18n/wizard/mobile-errors.js";

export type { MobileRetryGuideKind } from "../../../shared/i18n/wizard/mobile-errors.js";

interface MobileFailureIssue {
  kind?: MobileRetryGuideKind;
  summary: string;
}

export function simplifyMobileFailures(result: MobileRunResult | null, locale: WizardLocale): string[] {
  const deviceIssues = analyzeMobileFailureIssues(result, locale);
  const failedSteps = result?.steps.filter((step) => !step.ok) ?? [];
  const details = deviceIssues.length > 0
    ? deviceIssues.map((issue) => issue.summary)
    : failedSteps.map((step) => friendlySetupError(locale, step.detail));
  const seen = new Set<string>();
  const unique = details.filter((detail) => {
    if (seen.has(detail)) {
      return false;
    }
    seen.add(detail);
    return true;
  });

  return unique.length > 0 ? unique : [mobileRetryTextCatalog(locale).unknown];
}

export function classifyMobileRetryGuide(
  result: MobileRunResult | null,
  locale: WizardLocale
): MobileRetryGuideKind | undefined {
  const deviceIssue = analyzeMobileFailureIssues(result, locale).find((issue) => issue.kind);
  if (deviceIssue?.kind) {
    return deviceIssue.kind;
  }

  const detail = (result?.steps.map((step) => `${step.label}\n${step.detail}`).join("\n") ?? "").toLowerCase();
  const friendlyDetails = simplifyMobileFailures(result, locale).join("\n");
  const text = mobileRetryTextCatalog(locale);

  if (friendlyDetails.includes(text.iosTrust) || detail.includes("untrusted developer") || detail.includes("not trusted") || detail.includes("product > run")) {
    return "ios-trust";
  }
  if (friendlyDetails.includes(text.iosSigning) || detail.includes("provisioning profile") || detail.includes("problem signing")) {
    return "ios-signing";
  }
  if (friendlyDetails.includes(text.noXcode) || detail.includes("xcode command line tools") || detail.includes("xcode is missing")) {
    return "ios-xcode-missing";
  }
  if (friendlyDetails.includes(text.noCocoapods) || detail.includes("cocoapods")) {
    return "ios-cocoapods-missing";
  }
  if (friendlyDetails.includes(text.androidTools) || detail.includes("android platform tools") || detail.includes("adb")) {
    return "android-tools-missing";
  }

  return undefined;
}

export function onlyHasIosTrustIssue(result: MobileRunResult | null): boolean {
  const failedDevices = result?.deviceResults?.filter((deviceResult) => !deviceResult.ok) ?? [];
  return failedDevices.length > 0 && failedDevices.every((deviceResult) =>
    deviceResult.device.platform === "ios" && classifyMobileDetail(deviceResult.detail, deviceResult.device.platform) === "ios-trust"
  );
}

export function friendlySetupError(locale: WizardLocale, detail: string): string {
  const normalized = detail.toLowerCase();
  const text = errorTextCatalog(locale);

  if (normalized.includes("waiting for another flutter command to release the startup lock")) {
    return text.flutterLock;
  }
  if (
    normalized.includes("untrusted developer")
    || normalized.includes("not trusted")
    || normalized.includes("product > run")
    || normalized.includes("could not run build/ios/iphoneos/runner.app")
  ) {
    return text.iosTrust;
  }
  if (
    normalized.includes("provisioning profile")
    || normalized.includes("problem signing")
    || normalized.includes("no account for team")
    || normalized.includes("no profiles for")
  ) {
    return text.iosSigning;
  }
  if (normalized.includes("no macos desktop project configured") || normalized.includes("macos_device") || normalized.includes("buildmacos")) {
    return text.macosDevice;
  }
  if (normalized.includes("developer mode disabled") || normalized.includes("enable developer mode")) {
    return text.iosDeveloperMode;
  }
  if (
    normalized.includes("no installable mobile device found")
    || normalized.includes("no matching mobile device")
    || normalized.includes("no ios device")
    || normalized.includes("no android device")
  ) {
    return text.noDevice;
  }
  if (normalized.includes("flutter is not available") || normalized.includes("flutter command not found")) {
    return text.noFlutter;
  }
  if (normalized.includes("xcode command line tools are missing") || normalized.includes("xcode is missing")) {
    return text.noXcode;
  }
  if (normalized.includes("cocoapods is missing") || normalized.includes("pod --version")) {
    return text.noCocoapods;
  }
  if (
    normalized.includes("user rejected permissions")
    || normalized.includes("install_failed_aborted")
    || normalized.includes("install canceled")
    || normalized.includes("install cancelled")
  ) {
    return text.androidUserRejected;
  }
  if (
    normalized.includes("device unauthorized")
    || normalized.includes("unauthorized")
    || normalized.includes("insufficient permissions")
    || normalized.includes("no permissions")
  ) {
    return text.androidUnauthorized;
  }
  if (normalized.includes("device offline") || normalized.includes("offline")) {
    return text.androidOffline;
  }
  if (
    normalized.includes("install_failed_version_downgrade")
    || normalized.includes("install_failed_update_incompatible")
    || normalized.includes("install_failed_already_exists")
    || normalized.includes("conflicting provider")
    || normalized.includes("signatures do not match")
  ) {
    return text.androidInstallConflict;
  }
  if (
    normalized.includes("install_failed_insufficient_storage")
    || normalized.includes("not enough space")
    || normalized.includes("insufficient storage")
  ) {
    return text.androidStorage;
  }
  if (
    normalized.includes("install_failed_no_matching_abis")
    || normalized.includes("install_failed_older_sdk")
    || normalized.includes("sdk version")
    || normalized.includes("no matching abis")
  ) {
    return text.androidIncompatible;
  }
  if (normalized.includes("android platform tools are missing") || normalized.includes("adb")) {
    return text.androidTools;
  }

  return detail.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)[0] ?? text.unknown;
}

function analyzeMobileFailureIssues(result: MobileRunResult | null, locale: WizardLocale): MobileFailureIssue[] {
  const failedDevices = result?.deviceResults?.filter((deviceResult) => !deviceResult.ok) ?? [];
  if (failedDevices.length === 0) {
    return [];
  }

  return failedDevices.map((deviceResult) => {
    const kind = classifyMobileDetail(deviceResult.detail, deviceResult.device.platform);
    return {
      ...(kind ? { kind } : {}),
      summary: `${deviceResult.device.label}: ${friendlySetupError(locale, deviceResult.detail)}`
    };
  });
}

function classifyMobileDetail(detail: string, platform?: "android" | "ios"): MobileRetryGuideKind | undefined {
  const normalized = detail.toLowerCase();

  if (platform === "ios" || normalized.includes("ios") || normalized.includes("iphone") || normalized.includes("xcode")) {
    if (
      normalized.includes("untrusted developer")
      || normalized.includes("not trusted")
      || normalized.includes("developer app certificate")
      || normalized.includes("vpn & device management")
      || normalized.includes("could not run build/ios/iphoneos/runner.app")
    ) {
      return "ios-trust";
    }
    if (
      normalized.includes("provisioning profile")
      || normalized.includes("problem signing")
      || normalized.includes("no account for team")
      || normalized.includes("no profiles for")
      || normalized.includes("requires a development team")
      || normalized.includes("code signing")
    ) {
      return "ios-signing";
    }
    if (normalized.includes("xcode command line tools") || normalized.includes("xcode is missing")) {
      return "ios-xcode-missing";
    }
    if (normalized.includes("cocoapods") || normalized.includes("pod --version")) {
      return "ios-cocoapods-missing";
    }
  }

  if (platform === "android" || normalized.includes("android") || normalized.includes("adb") || normalized.includes("apk")) {
    if (
      normalized.includes("user rejected permissions")
      || normalized.includes("install_failed_aborted")
      || normalized.includes("install canceled")
      || normalized.includes("install cancelled")
    ) {
      return "android-user-rejected";
    }
    if (
      normalized.includes("unauthorized")
      || normalized.includes("no permissions")
      || normalized.includes("insufficient permissions")
      || normalized.includes("device unauthorized")
    ) {
      return "android-unauthorized";
    }
    if (normalized.includes("offline") || normalized.includes("device offline")) {
      return "android-offline";
    }
    if (
      normalized.includes("install_failed_version_downgrade")
      || normalized.includes("install_failed_update_incompatible")
      || normalized.includes("install_failed_already_exists")
      || normalized.includes("conflicting provider")
      || normalized.includes("signatures do not match")
    ) {
      return "android-install-conflict";
    }
    if (
      normalized.includes("install_failed_insufficient_storage")
      || normalized.includes("not enough space")
      || normalized.includes("insufficient storage")
    ) {
      return "android-storage";
    }
    if (
      normalized.includes("install_failed_no_matching_abis")
      || normalized.includes("install_failed_older_sdk")
      || normalized.includes("sdk version")
      || normalized.includes("no matching abis")
    ) {
      return "android-incompatible";
    }
    if (normalized.includes("android platform tools") || normalized.includes("adb")) {
      return "android-tools-missing";
    }
  }

  return undefined;
}
