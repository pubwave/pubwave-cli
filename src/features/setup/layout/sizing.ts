const MIN_SECTION_WIDTH = 56;
const MAX_SECTION_WIDTH = 112;
const SECTION_CHROME_WIDTH = 7;
const LARGE_BANNER_MIN_WIDTH = 62;
const ANSI_PATTERN = /\[[0-9;?]*[ -/]*[@-~]/g;

export function wizardSectionWidth(columns: number): number {
  const safeColumns = Math.max(40, columns);

  if (safeColumns <= MIN_SECTION_WIDTH + 2) {
    return Math.max(32, safeColumns - 2);
  }

  return Math.min(MAX_SECTION_WIDTH, safeColumns - 2);
}

export function wizardPanelHeight(rows: number): number {
  return Math.max(14, rows - 2);
}

export function wizardStepVisibleRowCount(input: {
  panelHeight: number;
  sectionWidth: number;
  compactMode: boolean;
  title: string;
  hint?: string;
  description?: string;
  navigationText: string;
}): number {
  const { panelHeight, sectionWidth, compactMode, title, hint, description, navigationText } = input;
  const spacing = compactMode ? 0 : 1;
  const contentWidth = sectionContentWidth(sectionWidth);
  const bannerRows = sectionWidth >= LARGE_BANNER_MIN_WIDTH ? 6 : 2;
  const titleRows = wrappedLineCount(title, contentWidth);
  const hintRows = hint ? wrappedLineCount(hint, contentWidth) : 0;
  const descriptionRows = description ? spacing + wrappedLineCount(description, contentWidth) : 0;
  const navigationRows = spacing + wrappedLineCount(`${navigationText}.`, contentWidth);
  const staticRows = bannerRows + 1 + (spacing + titleRows + hintRows) + spacing + descriptionRows + navigationRows;

  return Math.max(3, panelHeight - staticRows - 1);
}

export function statusRowContentWidth(sectionWidth: number): number {
  return Math.max(12, sectionWidth - SECTION_CHROME_WIDTH);
}

export function displayWidth(text: string): number {
  return Array.from(text.replace(ANSI_PATTERN, "")).reduce((total, char) => total + characterWidth(char), 0);
}

export function wrapStatusText(text: string, firstWidth: number, nextWidth = firstWidth): string[] {
  const normalized = text.replace(ANSI_PATTERN, "").replace(/\s+/g, " ").trim();

  if (!normalized) {
    return [""];
  }

  if (displayWidth(normalized) <= firstWidth) {
    return [normalized];
  }

  const segments: string[] = [];
  let currentLine = "";
  let currentWidth = 0;
  let lineWidthLimit = firstWidth;

  for (const char of Array.from(normalized)) {
    const charWidth = characterWidth(char);

    if (currentWidth + charWidth > lineWidthLimit && currentLine.length > 0) {
      segments.push(currentLine.trimEnd());
      currentLine = char === " " ? "" : char;
      currentWidth = char === " " ? 0 : charWidth;
      lineWidthLimit = nextWidth;
      continue;
    }

    currentLine += char;
    currentWidth += charWidth;
  }

  if (currentLine.length > 0) {
    segments.push(currentLine.trimEnd());
  }

  return segments;
}

export function padStatusText(text: string, width: number): string {
  const cleanText = text.replace(ANSI_PATTERN, "");
  const padding = Math.max(0, width - displayWidth(cleanText));
  return `${cleanText}${" ".repeat(padding)}`;
}

function sectionContentWidth(sectionWidth: number): number {
  return Math.max(12, sectionWidth - 2);
}

function wrappedLineCount(text: string, width: number): number {
  return wrapStatusText(text, width).length;
}

function characterWidth(char: string): number {
  const codePoint = char.codePointAt(0) ?? 0;

  if (codePoint === 0) {
    return 0;
  }

  if (isWideCharacter(codePoint) || isEmoji(codePoint)) {
    return 2;
  }

  return 1;
}

function isWideCharacter(codePoint: number): boolean {
  return (
    (codePoint >= 0x1100 && codePoint <= 0x115f) ||
    (codePoint >= 0x2329 && codePoint <= 0x232a) ||
    (codePoint >= 0x2e80 && codePoint <= 0xa4cf) ||
    (codePoint >= 0xac00 && codePoint <= 0xd7a3) ||
    (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
    (codePoint >= 0xfe10 && codePoint <= 0xfe19) ||
    (codePoint >= 0xfe30 && codePoint <= 0xfe6f) ||
    (codePoint >= 0xff00 && codePoint <= 0xff60) ||
    (codePoint >= 0xffe0 && codePoint <= 0xffe6) ||
    (codePoint >= 0x1f300 && codePoint <= 0x1faf6) ||
    (codePoint >= 0x20000 && codePoint <= 0x3fffd)
  );
}

function isEmoji(codePoint: number): boolean {
  return (
    (codePoint >= 0x1f300 && codePoint <= 0x1faff) ||
    (codePoint >= 0x2600 && codePoint <= 0x27bf)
  );
}
