import { describe, expect, it } from "vitest";
import {
  displayWidth,
  padStatusText,
  statusRowContentWidth,
  wizardPanelHeight,
  wizardSectionWidth,
  wizardStepVisibleRowCount,
  wrapStatusText
} from "../../../../src/features/setup/layout/sizing.js";

describe("wizardSectionWidth", () => {
  it("caps at the max for wide terminals", () => {
    expect(wizardSectionWidth(200)).toBe(112);
  });

  it("uses columns-2 for mid-size terminals", () => {
    expect(wizardSectionWidth(80)).toBe(78);
  });

  it("falls back to a safe minimum for narrow/zero widths", () => {
    expect(wizardSectionWidth(50)).toBe(48);
    expect(wizardSectionWidth(0)).toBe(38); // clamped to 40 columns -> max(32, 38)
  });
});

describe("wizardPanelHeight", () => {
  it("never claims more rows than the terminal has (rows-1 ceiling)", () => {
    for (const rows of [7, 10, 14, 18, 24, 40, 100]) {
      expect(wizardPanelHeight(rows)).toBeLessThanOrEqual(Math.max(6, rows - 1));
    }
  });

  it("clamps tiny terminals up to a floor", () => {
    expect(wizardPanelHeight(7)).toBe(6);
    expect(wizardPanelHeight(40)).toBe(38);
  });
});

describe("displayWidth", () => {
  it("counts ASCII as 1 and CJK as 2", () => {
    expect(displayWidth("abc")).toBe(3);
    expect(displayWidth("中文")).toBe(4);
  });

  it("ignores ANSI escape sequences", () => {
    expect(displayWidth("[31mhi[39m")).toBe(2);
  });
});

describe("wrapStatusText", () => {
  it("returns the text unchanged when it fits", () => {
    expect(wrapStatusText("short", 20)).toEqual(["short"]);
  });

  it("wraps on width boundaries", () => {
    expect(wrapStatusText("hello world", 5)).toEqual(["hello", "world"]);
  });

  it("returns a single empty string for empty input", () => {
    expect(wrapStatusText("", 10)).toEqual([""]);
  });
});

describe("padStatusText / statusRowContentWidth", () => {
  it("pads to the requested display width", () => {
    expect(padStatusText("hi", 5)).toBe("hi   ");
  });

  it("does not pad when already at/over width", () => {
    expect(padStatusText("hello", 3)).toBe("hello");
  });

  it("reserves chrome width with a floor", () => {
    expect(statusRowContentWidth(20)).toBe(13);
    expect(statusRowContentWidth(15)).toBe(12);
  });
});

describe("wizardStepVisibleRowCount", () => {
  it("returns at least the floor of 3 rows", () => {
    const rows = wizardStepVisibleRowCount({
      panelHeight: 10,
      sectionWidth: 80,
      compactMode: false,
      bannerTitle: "Pubwave",
      title: "Pick a model",
      hint: "choose one",
      description: "some description",
      navigationText: "Use arrows, Enter to continue"
    });
    expect(rows).toBeGreaterThanOrEqual(3);
    expect(Number.isInteger(rows)).toBe(true);
  });

  it("yields more visible rows when the panel is taller", () => {
    const base = { sectionWidth: 80, compactMode: false, bannerTitle: "Pubwave", title: "T", navigationText: "nav" };
    const small = wizardStepVisibleRowCount({ ...base, panelHeight: 14 });
    const large = wizardStepVisibleRowCount({ ...base, panelHeight: 40 });
    expect(large).toBeGreaterThan(small);
  });
});
