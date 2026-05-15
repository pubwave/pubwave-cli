export function firstLine(output: string, fallback: string): string {
  return output.split("\n").map((line) => line.trim()).find(Boolean) ?? fallback;
}
