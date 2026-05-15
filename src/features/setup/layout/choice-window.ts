import type { VisibleChoiceWindow } from "../types.js";

export function visibleChoiceWindow<T>(items: T[], selectedIndex: number, maxVisible: number): VisibleChoiceWindow<T> {
  if (items.length <= maxVisible) {
    return {
      items,
      startIndex: 0,
      hasHiddenAbove: false,
      hasHiddenBelow: false
    };
  }

  const half = Math.floor(maxVisible / 2);
  const maxStart = items.length - maxVisible;
  const startIndex = Math.max(0, Math.min(selectedIndex - half, maxStart));

  return {
    items: items.slice(startIndex, startIndex + maxVisible),
    startIndex,
    hasHiddenAbove: startIndex > 0,
    hasHiddenBelow: startIndex + maxVisible < items.length
  };
}
