import { useEffect, useState } from "react";

export function useTerminalSize(): { rows: number; columns: number } {
  const [size, setSize] = useState(() => ({
    rows: process.stdout.rows ?? 24,
    columns: process.stdout.columns ?? 80
  }));

  useEffect(() => {
    const update = () => {
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

  return size;
}
