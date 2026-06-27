import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const LOVABLE_AIG_RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";

export function createLovableAiGatewayProvider(lovableApiKey: string, initialRunId?: string) {
  let runId = initialRunId?.trim() || undefined;
  let resolveRunId: (v: string | undefined) => void = () => {};
  let resolved = false;
  const ready = new Promise<string | undefined>((r) => (resolveRunId = r));
  const publish = (v?: string) => {
    const n = v?.trim() || undefined;
    if (!runId && n) runId = n;
    if (!resolved) { resolved = true; resolveRunId(runId); }
  };
  if (runId) publish(runId);

  const provider = createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: {
      "Lovable-API-Key": lovableApiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
    fetch: async (input, init) => {
      const headers = new Headers(init?.headers);
      if (runId && !headers.has(LOVABLE_AIG_RUN_ID_HEADER)) headers.set(LOVABLE_AIG_RUN_ID_HEADER, runId);
      try {
        const r = await fetch(input, { ...init, headers });
        publish(r.headers.get(LOVABLE_AIG_RUN_ID_HEADER) ?? undefined);
        return r;
      } catch (e) { publish(undefined); throw e; }
    },
  });
  return Object.assign(provider, {
    getRunId: () => runId,
    waitForRunId: () => (runId ? Promise.resolve(runId) : ready),
  });
}

export async function callLovableAI(body: unknown): Promise<Response> {
  const key = process.env.groq_api;
  if (!key) throw new Error("Missing groq_api");
  return fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });
}
