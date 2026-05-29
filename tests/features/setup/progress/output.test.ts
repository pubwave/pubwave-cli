import { describe, expect, it } from "vitest";
import {
  buildFlutterDownloadProgressText,
  latestOllamaPullStatus,
  localModelProgressColor,
  localModelProgressText,
  mergeOutputLines,
  normalizeSetupOutputLines,
  setupOutputProgressKey,
  stripTrailingDots,
  withAnimatedDots
} from "../../../../src/features/setup/progress/output.js";

describe("stripTrailingDots / withAnimatedDots", () => {
  it("strips up to three trailing dots", () => {
    expect(stripTrailingDots("Working...")).toBe("Working");
    expect(stripTrailingDots("Working")).toBe("Working");
  });

  it("re-attaches animated dots after stripping", () => {
    expect(withAnimatedDots("Saving...", "..")).toBe("Saving..");
    expect(withAnimatedDots("Saving", "")).toBe("Saving");
  });
});

describe("setupOutputProgressKey", () => {
  it("collapses bare percent lines under one key", () => {
    expect(setupOutputProgressKey("50%")).toBe("download-progress");
    expect(setupOutputProgressKey("## 50%")).toBe("download-progress");
  });

  it("keys ollama pulling lines by layer", () => {
    expect(setupOutputProgressKey("pulling manifest")).toBe("pulling:manifest");
    expect(setupOutputProgressKey("pulling abc123: 50%")).toBe("pulling:abc123");
  });

  it("recognizes flutter pub + startup-lock lines", () => {
    expect(setupOutputProgressKey("Resolving dependencies...")).toBe("flutter-pub-resolving-dependencies");
    expect(setupOutputProgressKey("Downloading packages... 2.0s")).toBe("flutter-pub-downloading-packages");
    expect(setupOutputProgressKey("Waiting for another flutter command to release the startup lock..."))
      .toBe("flutter-startup-lock");
  });

  it("returns null for ordinary lines", () => {
    expect(setupOutputProgressKey("just some text")).toBeNull();
  });
});

describe("mergeOutputLines", () => {
  it("replaces a same-key progress line in place", () => {
    const merged = mergeOutputLines(
      [{ text: "pulling manifest", color: "cyan" }],
      [{ text: "pulling manifest 50%", color: "cyan" }]
    );
    expect(merged).toHaveLength(1);
    expect(merged[0]!.text).toBe("pulling manifest 50%");
  });

  it("appends non-progress lines", () => {
    const merged = mergeOutputLines([{ text: "foo", color: "cyan" }], [{ text: "bar", color: "cyan" }]);
    expect(merged.map((l) => l.text)).toEqual(["foo", "bar"]);
  });
});

describe("latestOllamaPullStatus", () => {
  it("returns the last pull/verify/write/success segment", () => {
    expect(latestOllamaPullStatus("pulling manifest\npulling layer 50%")).toContain("layer");
    expect(latestOllamaPullStatus("success")).toContain("success");
  });

  it("returns null when an error is present", () => {
    expect(latestOllamaPullStatus("error: something failed")).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(latestOllamaPullStatus("")).toBeNull();
  });
});

describe("normalizeSetupOutputLines", () => {
  it("drops installer noise and bare percent lines, keeps real output", () => {
    const input = "verifying sha256 digest\n100%\n>>> Installing Ollama to /usr/local";
    expect(normalizeSetupOutputLines(input)).toEqual(["verifying sha256 digest"]);
  });

  it("returns an empty array when everything is noise", () => {
    expect(normalizeSetupOutputLines(">>> Downloading Ollama for darwin\n\n  ")).toEqual([]);
  });
});

describe("localModelProgressText / color", () => {
  it("includes the model name for model-specific stages", () => {
    expect(localModelProgressText("en", "check-model", "qwen3:8b")).toContain("qwen3:8b");
    expect(localModelProgressText("en", "pull-model", "qwen3:8b")).toContain("qwen3:8b");
  });

  it("marks long-running stages yellow and quick checks cyan", () => {
    expect(localModelProgressColor("install-runtime")).toBe("yellow");
    expect(localModelProgressColor("pull-model")).toBe("yellow");
    expect(localModelProgressColor("start-runtime")).toBe("yellow");
    expect(localModelProgressColor("check-runtime")).toBe("cyan");
    expect(localModelProgressColor("verify-model")).toBe("cyan");
  });
});

describe("buildFlutterDownloadProgressText", () => {
  it("shows a percentage when total size is known", () => {
    const text = buildFlutterDownloadProgressText("en", {
      stage: "download",
      receivedBytes: 5 * 1024 * 1024,
      totalBytes: 10 * 1024 * 1024
    });
    expect(text).toContain("50%");
    expect(text).toContain("MB");
  });

  it("shows only received MB when total size is unknown", () => {
    const text = buildFlutterDownloadProgressText("en", { stage: "download", receivedBytes: 2 * 1024 * 1024 });
    expect(text).toContain("MB");
    expect(text).not.toContain("%");
  });
});
