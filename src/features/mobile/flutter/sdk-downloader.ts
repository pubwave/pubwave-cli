import { mkdir, open, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import type { FlutterProgressEvent } from "../types.js";

export async function downloadArchive(
  archiveUrl: string,
  targetFile: string,
  onProgress?: (event: FlutterProgressEvent) => void | Promise<void>
): Promise<void> {
  await mkdir(path.dirname(targetFile), { recursive: true });
  const existingBytes = await fileSize(targetFile);
  const response = await fetch(
    archiveUrl,
    existingBytes > 0 ? { headers: { Range: `bytes=${existingBytes}-` } } : {}
  );

  if (response.status === 416) {
    const totalBytes = totalBytesFromResponse(response);
    if (typeof totalBytes === "number" && totalBytes === existingBytes) {
      await onProgress?.({ stage: "download", receivedBytes: totalBytes, totalBytes });
      return;
    }

    await rm(targetFile, { force: true });
    return downloadArchive(archiveUrl, targetFile, onProgress);
  }

  if (!response.ok) {
    throw new Error(`Flutter download failed with status ${response.status}.`);
  }

  const appendMode = existingBytes > 0 && response.status === 206;
  const resumedBytes = appendMode ? existingBytes : 0;
  const totalBytes = totalBytesFromResponse(response, resumedBytes);

  if (existingBytes > 0 && !appendMode) {
    await rm(targetFile, { force: true });
  }

  if (!response.body) {
    const archive = Buffer.from(await response.arrayBuffer());
    await writeFile(targetFile, archive);
    await onProgress?.({
      stage: "download",
      receivedBytes: resumedBytes + archive.length,
      totalBytes: totalBytes ?? (resumedBytes + archive.length)
    });
    return;
  }

  const fileHandle = await open(targetFile, appendMode ? "a" : "w");
  let receivedBytes = resumedBytes;
  let lastReportedPercent = -1;

  try {
    const reader = response.body.getReader();
    if (resumedBytes > 0) {
      await onProgress?.({
        stage: "download",
        receivedBytes: resumedBytes,
        ...(typeof totalBytes === "number" ? { totalBytes } : {})
      });
    }

    while (true) {
      const chunk = await reader.read();
      if (chunk.done) {
        break;
      }
      await fileHandle.write(chunk.value);
      receivedBytes += chunk.value.length;
      const nextPercent = totalBytes && totalBytes > 0
        ? Math.min(100, Math.floor((receivedBytes / totalBytes) * 100))
        : undefined;
      const shouldReport = nextPercent === undefined || nextPercent !== lastReportedPercent;

      if (shouldReport) {
        lastReportedPercent = nextPercent ?? lastReportedPercent;
        await onProgress?.({
          stage: "download",
          receivedBytes,
          ...(typeof totalBytes === "number" ? { totalBytes } : {})
        });
      }
    }
  } finally {
    await fileHandle.close();
  }

  if (typeof totalBytes === "number" && receivedBytes !== totalBytes) {
    throw new Error(`Flutter download is incomplete (${receivedBytes}/${totalBytes} bytes).`);
  }
}

async function fileSize(filePath: string): Promise<number> {
  try {
    return (await stat(filePath)).size;
  } catch {
    return 0;
  }
}

function totalBytesFromResponse(response: Response, fallbackBytes = 0): number | undefined {
  const contentRange = response.headers.get("content-range");
  if (contentRange) {
    const totalMatch = contentRange.match(/\/(\d+)$/);
    const totalValue = totalMatch?.[1];
    if (totalValue) {
      return Number.parseInt(totalValue, 10);
    }
  }

  const contentLength = response.headers.get("content-length");
  if (!contentLength) {
    return undefined;
  }

  const parsedLength = Number.parseInt(contentLength, 10);
  if (!Number.isFinite(parsedLength)) {
    return undefined;
  }

  return response.status === 206 ? fallbackBytes + parsedLength : parsedLength;
}
