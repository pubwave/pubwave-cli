import { describe, expect, it } from "vitest";
import {
  classifyMobileRetryGuide,
  friendlySetupError,
  onlyHasIosTrustIssue,
  simplifyMobileFailures
} from "../../../../src/features/setup/mobile/error-analysis.js";
import { errorTextCatalog } from "../../../../src/shared/i18n/wizard/mobile-errors.js";
import type { MobileRunResult } from "../../../../src/features/mobile/types.js";

function deviceFailure(platform: "ios" | "android", detail: string): MobileRunResult {
  return {
    ok: false,
    steps: [],
    deviceResults: [
      { device: { id: "d1", label: platform === "ios" ? "iPhone" : "Pixel", platform }, label: "flutter run", ok: false, detail }
    ]
  } as unknown as MobileRunResult;
}

describe("friendlySetupError", () => {
  const en = errorTextCatalog("en");

  it("maps the flutter startup lock message", () => {
    expect(friendlySetupError("en", "Waiting for another flutter command to release the startup lock..."))
      .toBe(en.flutterLock);
  });

  it("maps iOS trust and signing messages", () => {
    expect(friendlySetupError("en", "This is an Untrusted Developer")).toBe(en.iosTrust);
    expect(friendlySetupError("en", "No provisioning profile found")).toBe(en.iosSigning);
  });

  it("falls back to the first non-empty line for unrecognized errors", () => {
    expect(friendlySetupError("en", "Totally novel failure\nsecond line")).toBe("Totally novel failure");
  });

  it("uses the unknown catalog text for empty input", () => {
    expect(friendlySetupError("en", "")).toBe(en.unknown);
  });
});

describe("classifyMobileRetryGuide", () => {
  it("classifies an iOS trust device failure", () => {
    expect(classifyMobileRetryGuide(deviceFailure("ios", "Untrusted Developer"), "en")).toBe("ios-trust");
  });

  it("classifies an android unauthorized device failure", () => {
    expect(classifyMobileRetryGuide(deviceFailure("android", "adb: device unauthorized"), "en"))
      .toBe("android-unauthorized");
  });

  it("returns undefined when there is no failure", () => {
    expect(classifyMobileRetryGuide(null, "en")).toBeUndefined();
  });
});

describe("onlyHasIosTrustIssue", () => {
  it("is true when every failing device is an iOS trust issue", () => {
    expect(onlyHasIosTrustIssue(deviceFailure("ios", "Untrusted Developer"))).toBe(true);
  });

  it("is false for android failures", () => {
    expect(onlyHasIosTrustIssue(deviceFailure("android", "device unauthorized"))).toBe(false);
  });

  it("is false when there are no device failures", () => {
    expect(onlyHasIosTrustIssue(null)).toBe(false);
    expect(onlyHasIosTrustIssue({ ok: true, steps: [], deviceResults: [] } as unknown as MobileRunResult)).toBe(false);
  });
});

describe("simplifyMobileFailures", () => {
  it("dedups repeated failure summaries", () => {
    const result = {
      ok: false,
      steps: [],
      deviceResults: [
        { device: { id: "a", label: "iPhone", platform: "ios" }, label: "run", ok: false, detail: "Untrusted Developer" },
        { device: { id: "a", label: "iPhone", platform: "ios" }, label: "run", ok: false, detail: "Untrusted Developer" }
      ]
    } as unknown as MobileRunResult;
    const summaries = simplifyMobileFailures(result, "en");
    expect(summaries).toHaveLength(1);
  });

  it("returns the unknown message when there is nothing to report", () => {
    expect(simplifyMobileFailures(null, "en")).toHaveLength(1);
  });
});
