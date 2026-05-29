import { describe, expect, it } from "vitest";
import { bannerRowCount, resolveBanner } from "../../src/ui/primitives/cli-banner.js";

describe("resolveBanner", () => {
  it("renders figlet art when it fits the width", () => {
    const banner = resolveBanner("Pubwave", 96, false);
    expect(banner.kind).toBe("art");
    if (banner.kind === "art") {
      expect(banner.rows.length).toBeGreaterThan(0);
      expect(banner.width).toBeLessThanOrEqual(96 - 2);
    }
  });

  it("falls back to a spaced compact title when the art is too wide", () => {
    const banner = resolveBanner("Pubwave", 12, false);
    expect(banner.kind).toBe("compact");
    if (banner.kind === "compact") {
      expect(banner.text).toBe("P U B W A V E");
    }
  });

  it("always uses compact text when compact is requested", () => {
    const banner = resolveBanner("Hi", 96, true);
    expect(banner).toEqual({ kind: "compact", text: "H I" });
  });

  it("substitutes a placeholder for an empty title", () => {
    expect(() => resolveBanner("", 96, false)).not.toThrow();
    const compact = resolveBanner("", 4, false);
    expect(compact.kind).toBe("compact");
    if (compact.kind === "compact") {
      expect(compact.text).toBe("A P P");
    }
  });
});

describe("bannerRowCount", () => {
  it("counts compact banners as two rows (line + margin)", () => {
    expect(bannerRowCount("Hi", 96, true)).toBe(2);
    expect(bannerRowCount("Pubwave", 12, false)).toBe(2);
  });

  it("counts art rows plus the wave line and margin", () => {
    const banner = resolveBanner("Pubwave", 96, false);
    if (banner.kind === "art") {
      expect(bannerRowCount("Pubwave", 96, false)).toBe(banner.rows.length + 2);
    }
  });
});
