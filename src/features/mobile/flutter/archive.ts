import os from "node:os";
import { runCommand } from "../../../node/process.js";

export async function extractArchive(archivePath: string, extractDir: string): Promise<void> {
  const platform = os.platform();
  const result = platform === "darwin"
    ? runCommand("ditto", ["-x", "-k", archivePath, extractDir])
    : platform === "linux"
      ? runCommand("tar", ["-xf", archivePath, "-C", extractDir])
      : platform === "win32"
        ? runCommand("powershell", ["-NoProfile", "-Command", `Expand-Archive -LiteralPath '${archivePath}' -DestinationPath '${extractDir}' -Force`])
        : { ok: false, stdout: "", stderr: "Current platform is not supported for automatic Flutter install.", exitCode: null };

  if (!result.ok) {
    throw new Error(result.stderr || result.stdout || "Could not extract Flutter archive.");
  }
}
