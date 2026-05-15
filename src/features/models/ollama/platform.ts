export function installCommandForPlatform(): { command: string; args: string[] } | null {
  switch (process.platform) {
    case "darwin":
    case "linux":
      return {
        command: "sh",
        args: ["-lc", "curl -fsSL --no-progress-meter https://ollama.com/install.sh | OLLAMA_NO_START=1 sh"]
      };
    case "win32":
      return {
        command: "powershell",
        args: ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", "irm https://ollama.com/install.ps1 | iex"]
      };
    default:
      return null;
  }
}

export async function delay(milliseconds: number): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
