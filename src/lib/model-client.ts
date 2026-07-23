const CANDIDATES: { endpoint: string; model: string }[] = [
  // Whatever the person configured via env is tried first, further down.
  { endpoint: "https://models.inference.ai.azure.com", model: "azureml/Phi-4" },
  { endpoint: "https://models.inference.ai.azure.com", model: "Phi-4" },
  { endpoint: "https://models.github.ai/inference", model: "microsoft/Phi-4" },
  { endpoint: "https://models.inference.ai.azure.com", model: "microsoft/Phi-4" },
  { endpoint: "https://models.github.ai/inference", model: "openai/gpt-4o-mini" },
  { endpoint: "https://models.inference.ai.azure.com", model: "gpt-4o-mini" },
  { endpoint: "https://models.inference.ai.azure.com", model: "openai/gpt-4o-mini" },
];

// Once a working combination is found, reuse it for the rest of this
// server instance's lifetime instead of re-probing every request.
let cachedWorking: { endpoint: string; model: string } | null = null;

export interface ModelCallResult {
  ok: boolean;
  content?: string;
  detail?: string;
  endpoint?: string;
  model?: string;
}

async function tryOnce(
  endpoint: string,
  model: string,
  token: string,
  messages: { role: string; content: string }[],
  maxTokens: number,
  timeoutMs: number
): Promise<ModelCallResult> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`${endpoint}/chat/completions`, {
      signal: controller.signal,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: maxTokens }),
    });
    clearTimeout(timer);

    if (!res.ok) {
      const body = await res.text().catch(() => "<no body>");
      return {
        ok: false,
        detail: `${res.status} ${res.statusText}: ${body.slice(0, 300)}`,
        endpoint,
        model,
      };
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      return { ok: false, detail: "Empty response content", endpoint, model };
    }
    return { ok: true, content, endpoint, model };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : String(err), endpoint, model };
  }
}

/**
 * Calls GitHub Models, trying the configured endpoint/model first, then a
 * list of other known-plausible combinations if that one fails, so a wrong
 * model ID doesn't take the whole feature down. Logs every attempt to
 * console.error so failures are visible in Netlify function logs even
 * though the caller can't see a browser console.
 */
export async function callModel(
  messages: { role: string; content: string }[],
  options: { maxTokens?: number; timeoutMs?: number; label: string } = { label: "model" }
): Promise<ModelCallResult> {
  const token = process.env.GITHUB_MODELS_TOKEN;
  const maxTokens = options.maxTokens ?? 200;
  const timeoutMs = options.timeoutMs ?? 4500;
  const label = options.label;

  if (!token) {
    console.warn(`[${label}] GITHUB_MODELS_TOKEN not set`);
    return { ok: false, detail: "GITHUB_MODELS_TOKEN not set" };
  }

  const configured = {
    endpoint: process.env.GITHUB_MODELS_ENDPOINT ?? "https://models.inference.ai.azure.com",
    model: process.env.GITHUB_MODELS_MODEL ?? "azureml/Phi-4",
  };

  const attempts = [
    cachedWorking,
    configured,
    ...CANDIDATES,
  ].filter((c, i, arr): c is { endpoint: string; model: string } => {
    if (!c) return false;
    return arr.findIndex((x) => x && x.endpoint === c.endpoint && x.model === c.model) === i;
  }).slice(0, 6);

  const failures: string[] = [];

  for (const candidate of attempts) {
    const result = await tryOnce(candidate.endpoint, candidate.model, token, messages, maxTokens, timeoutMs);
    if (result.ok) {
      if (!cachedWorking || cachedWorking.model !== candidate.model || cachedWorking.endpoint !== candidate.endpoint) {
        console.warn(`[${label}] Using working model config: endpoint=${candidate.endpoint} model=${candidate.model}`);
        cachedWorking = candidate;
      }
      return result;
    }
    failures.push(`endpoint=${candidate.endpoint} model=${candidate.model} -> ${result.detail}`);

    // A 401/403 means the token itself is the problem, not the model name.
    // Trying more model IDs with the same bad token will just fail the
    // same way, so stop immediately instead of burning the user's time.
    if (result.detail?.startsWith("401") || result.detail?.startsWith("403")) {
      console.error(`[${label}] Auth failure, stopping further attempts: ${result.detail}`);
      break;
    }
  }

  console.error(`[${label}] All model attempts failed:\n${failures.join("\n")}`);
  return { ok: false, detail: failures.join(" | ") };
}
