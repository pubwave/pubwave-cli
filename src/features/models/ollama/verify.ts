import type { LocalModelInstallResult } from "../types.js";

export async function verifyOllamaModelReady(model: string): Promise<LocalModelInstallResult> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const result = await runOllamaVerification(model);
    if (result.ok) {
      return result;
    }
    if (attempt === 1) {
      return result;
    }
  }

  return {
    ok: false,
    detail: "verification failed"
  };
}

async function runOllamaVerification(model: string): Promise<LocalModelInstallResult> {
  try {
    const response = await fetch("http://127.0.0.1:11434/api/chat", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          { role: "system", content: "Return valid JSON only." },
          { role: "user", content: "Return {\"ok\":true}." }
        ],
        format: "json"
      }),
      signal: AbortSignal.timeout(60_000)
    });

    if (!response.ok) {
      return {
        ok: false,
        detail: `verification request failed with ${response.status}`
      };
    }

    const payload = await response.json() as { message?: { content?: string } };
    const parsed = parseJsonObject(payload.message?.content ?? "");
    return parsed?.ok === true
      ? { ok: true, detail: "Local model verified." }
      : { ok: false, detail: "verification response did not contain the expected JSON payload" };
  } catch (error) {
    return {
      ok: false,
      detail: error instanceof Error ? error.message : "verification failed"
    };
  }
}

function parseJsonObject(content: string): { ok?: boolean } | null {
  const normalized = content.trim();
  const unfenced = normalized.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const start = unfenced.indexOf("{");
  const end = unfenced.lastIndexOf("}");
  const candidate = start >= 0 && end >= start ? unfenced.slice(start, end + 1) : unfenced;
  try {
    return JSON.parse(candidate) as { ok?: boolean };
  } catch {
    return null;
  }
}
