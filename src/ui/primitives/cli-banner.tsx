import React from "react";
import { Box, Text } from "ink";
import figlet from "figlet";

interface CliBannerProps {
  width?: number;
  title?: string;
}

export function CliBanner({ width, title = "Pubwave" }: CliBannerProps): React.ReactElement {
  const rendered = renderTitle(title, width);
  const rows = rendered.split("\n").filter((row) => row.trim().length > 0);

  return (
    <Box marginBottom={1} flexDirection="column">
      {rows.map((row, index) => (
        <Text key={`${index}-${row}`} color={rowColor(index, rows.length)}>
          {row.replace(/\s+$/, "")}
        </Text>
      ))}
    </Box>
  );
}

function renderTitle(title: string, width?: number): string {
  const displayTitle = title.trim() || "App";
  const safeWidth = Math.max(32, (width ?? process.stdout.columns ?? 96) - 2);
  const fonts: figlet.Fonts[] = ["ANSI Shadow", "Doom", "Big", "Standard", "Small"];

  for (const font of fonts) {
    const rendered = figlet.textSync(displayTitle, {
      font,
      horizontalLayout: "fitted",
      verticalLayout: "default",
      width: safeWidth
    });
    const maxWidth = Math.max(...rendered.split("\n").map((row) => row.replace(/\s+$/, "").length));
    if (maxWidth <= safeWidth) {
      return rendered;
    }
  }

  return displayTitle;
}

function rowColor(rowIndex: number, totalRows: number): string {
  const rowRatio = totalRows <= 1 ? 0 : rowIndex / (totalRows - 1);
  const color = mixColor({ r: 255, g: 255, b: 255 }, { r: 0, g: 182, b: 255 }, rowRatio);
  return rgbToHex(color);
}

function mixColor(
  from: { r: number; g: number; b: number },
  to: { r: number; g: number; b: number },
  ratio: number
): { r: number; g: number; b: number } {
  return {
    r: Math.round(from.r + (to.r - from.r) * ratio),
    g: Math.round(from.g + (to.g - from.g) * ratio),
    b: Math.round(from.b + (to.b - from.b) * ratio)
  };
}

function rgbToHex(color: { r: number; g: number; b: number }): string {
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
}

function toHex(value: number): string {
  return Math.max(0, Math.min(255, value)).toString(16).padStart(2, "0");
}
