import { useEffect, useState } from "react";

const DEFAULT_DOT_FRAMES = [".", "..", "..."];

export function useAnimatedDots(active: boolean, frames = DEFAULT_DOT_FRAMES, intervalMs = 350): string {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      setIndex(0);
      return;
    }

    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % frames.length);
    }, intervalMs);

    return () => {
      clearInterval(timer);
    };
  }, [active, frames, intervalMs]);

  return frames[index] ?? "";
}
