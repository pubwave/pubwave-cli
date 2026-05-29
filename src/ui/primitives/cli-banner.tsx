import React from "react";
import { Box, Text } from "ink";
import figlet from "figlet";

interface CliBannerProps {
  width?: number;
  title?: string;
  compact?: boolean;
}

const BANNER_FONT: figlet.Fonts = "ANSI Regular";
const WAVE_PATTERN = "▁▂▃▄▅▆▇█▇▆▅▄▃▂▁";
// Neon ramp: bright teal -> cyan -> sky -> indigo -> violet.
const NEON_RAMP = ["#5EF1D6", "#22D3EE", "#38BDF8", "#6366F1", "#A855F7"];
// Section adds paddingX={1}; the banner content lives inside `sectionWidth - PADDING`.
const PADDING = 2;
const MIN_CONTENT_WIDTH = 20;

export function CliBanner({ width, title = "Pubwave", compact = false }: CliBannerProps): React.ReactElement {
  const sectionWidth = width ?? process.stdout.columns ?? 96;
  const banner = resolveBanner(title, sectionWidth, compact);
  const useColor = !process.env.NO_COLOR;

  if (banner.kind === "compact") {
    return (
      <Box marginBottom={1}>
        <Text wrap="truncate" color={useColor ? NEON_RAMP[0] : undefined}>{banner.text}</Text>
      </Box>
    );
  }

  return (
    <Box marginBottom={1} flexDirection="column">
      {banner.rows.map((row, index) => (
        <Text key={`row-${index}`} wrap="truncate">{gradientLine(row, banner.width, useColor, `row-${index}`)}</Text>
      ))}
      <Text wrap="truncate">{gradientLine(waveformBar(banner.width), banner.width, useColor, "wave")}</Text>
    </Box>
  );
}

type ResolvedBanner =
  | { kind: "art"; rows: string[]; width: number }
  | { kind: "compact"; text: string };

// Single source of truth for what the banner renders at a given size, used by
// both the component and the layout height budget so they can never disagree.
export function resolveBanner(title: string, sectionWidth: number, compact: boolean): ResolvedBanner {
  const displayTitle = (title ?? "").trim() || "App";
  const contentWidth = Math.max(MIN_CONTENT_WIDTH, sectionWidth - PADDING);

  if (!compact) {
    const art = measureArt(displayTitle);
    if (art && art.width <= contentWidth) {
      return { kind: "art", rows: art.rows, width: art.width };
    }
  }

  return { kind: "compact", text: displayTitle.toUpperCase().split("").join(" ") };
}

// Total vertical footprint INCLUDING the marginBottom={1} on the banner box.
export function bannerRowCount(title: string, sectionWidth: number, compact: boolean): number {
  const banner = resolveBanner(title, sectionWidth, compact);
  return banner.kind === "art" ? banner.rows.length + 2 : 2;
}

const artCache = new Map<string, { rows: string[]; width: number } | null>();

function measureArt(title: string): { rows: string[]; width: number } | null {
  const cached = artCache.get(title);
  if (cached !== undefined) {
    return cached;
  }

  let result: { rows: string[]; width: number } | null = null;
  try {
    const rendered = figlet.textSync(title, {
      font: BANNER_FONT,
      horizontalLayout: "default",
      verticalLayout: "default"
    });
    const rows = rendered
      .split("\n")
      .map((row) => row.replace(/\s+$/, ""))
      .filter((row) => row.length > 0);
    if (rows.length > 0) {
      result = { rows, width: rows.reduce((max, row) => Math.max(max, row.length), 0) };
    }
  } catch {
    result = null;
  }

  artCache.set(title, result);
  return result;
}

function waveformBar(width: number): string {
  let bar = "";
  while (bar.length < width) {
    bar += WAVE_PATTERN;
  }
  return bar.slice(0, width);
}

function gradientLine(text: string, totalWidth: number, useColor: boolean, keyPrefix: string): React.ReactNode {
  if (!useColor) {
    return text;
  }
  return text.split("").map((char, col) => (
    <Text key={`${keyPrefix}-${col}`} color={rampAt(totalWidth <= 1 ? 0 : col / (totalWidth - 1))}>
      {char}
    </Text>
  ));
}

function rampAt(t: number): string {
  const clamped = Math.min(1, Math.max(0, t));
  const scaled = clamped * (NEON_RAMP.length - 1);
  const lo = Math.floor(scaled);
  const hi = Math.min(NEON_RAMP.length - 1, lo + 1);
  return hexLerp(NEON_RAMP[lo], NEON_RAMP[hi], scaled - lo);
}

function hexLerp(a: string, b: string, t: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const mix = (x: number, y: number): number => Math.round(x + (y - x) * t);
  return rgbToHex(mix(ca.r, cb.r), mix(ca.g, cb.g), mix(ca.b, cb.b));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}
