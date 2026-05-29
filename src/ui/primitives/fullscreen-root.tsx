import React, { useEffect, useState } from "react";
import { Box } from "ink";

// Bounds a fullscreen TUI to the terminal viewport. A fixed-height,
// overflow-hidden box keeps every rendered frame exactly `rows` lines tall
// (short content is padded, taller content is clipped to the top), so Ink can
// always fully clear the previous frame instead of smearing stale frames when
// the terminal is resized.
export function FullscreenRoot({ children }: { children: React.ReactNode }): React.ReactElement {
  const [size, setSize] = useState(() => ({
    rows: process.stdout.rows ?? 24,
    columns: process.stdout.columns ?? 80
  }));

  useEffect(() => {
    const update = (): void => {
      setSize({
        rows: process.stdout.rows ?? 24,
        columns: process.stdout.columns ?? 80
      });
    };
    process.stdout.on("resize", update);
    return () => {
      process.stdout.off("resize", update);
    };
  }, []);

  return (
    <Box flexDirection="column" width={size.columns} height={size.rows} overflow="hidden">
      <Box flexDirection="column" flexShrink={0}>
        {children}
      </Box>
    </Box>
  );
}
