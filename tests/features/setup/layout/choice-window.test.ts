import { describe, expect, it } from "vitest";
import { visibleChoiceWindow } from "../../../../src/features/setup/layout/choice-window.js";

const items = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

describe("visibleChoiceWindow", () => {
  it("shows everything when items fit", () => {
    expect(visibleChoiceWindow([1, 2, 3], 0, 5)).toEqual({
      items: [1, 2, 3],
      startIndex: 0,
      hasHiddenAbove: false,
      hasHiddenBelow: false
    });
  });

  it("anchors at the top when the selection is near the start", () => {
    const w = visibleChoiceWindow(items, 0, 4);
    expect(w.startIndex).toBe(0);
    expect(w.items).toEqual([0, 1, 2, 3]);
    expect(w.hasHiddenAbove).toBe(false);
    expect(w.hasHiddenBelow).toBe(true);
  });

  it("centers the selection in the middle", () => {
    const w = visibleChoiceWindow(items, 5, 4);
    expect(w.startIndex).toBe(3);
    expect(w.items).toEqual([3, 4, 5, 6]);
    expect(w.hasHiddenAbove).toBe(true);
    expect(w.hasHiddenBelow).toBe(true);
  });

  it("anchors at the bottom when the selection is near the end", () => {
    const w = visibleChoiceWindow(items, 9, 4);
    expect(w.startIndex).toBe(6);
    expect(w.items).toEqual([6, 7, 8, 9]);
    expect(w.hasHiddenAbove).toBe(true);
    expect(w.hasHiddenBelow).toBe(false);
  });
});
