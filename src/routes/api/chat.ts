import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createHash } from "crypto";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { rateLimit, clientIp, rateLimitHeaders } from "@/lib/rate-limit.server";

const SYSTEM = `You are the ANIMA Nexus Assistant — a warm, expert AI guardian inside a futuristic animal protection platform.

Your job:
- Help users understand and protect their pets, shelter animals, livestock, service animals, and wildlife.
- Explain platform modules: Digital Twin, Health AI, Lost Pet Recovery, Shelter Matching, Wildlife Guardian, Audio Analysis, Emergency Response.
- Give clear, actionable advice on animal health, behavior, safety, rescue, and emergencies.
- For urgent symptoms (poison, heatstroke, severe injury, seizure, bloat, difficulty breathing): tell the user to contact a vet or emergency animal hospital IMMEDIATELY, then provide stabilization steps.
- Be concise, kind, and confident. Use short paragraphs and bullets. Format with markdown.
- Never claim to replace a veterinarian or wildlife expert. Always recommend professional help for serious concerns.

Tone: futuristic but human; like a calm mission-control specialist who genuinely loves animals.`;

const CACHE_SCHEMA_VERSION = "v1";

function normalizePrompt(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

function hashPrompt(text: string): string {
  return createHash("sha256").update(`${CACHE_SCHEMA_VERSION}:${normalizePrompt(text)}`).digest("hex");
}

function extractText(parts: unknown): string {
  if (!Array.isArray(parts)) return "";
  return parts
    .map((p) => (p && typeof p === "object" && (p as { type?: string }).type === "text" ? (p as { text?: string }).text ?? "" : ""))
    .join("");
}

// Build a minimal AI SDK UI message stream from a cached string.
// Emits start, text-start, text-delta, text-end, finish events compatible with useChat.
function cachedUIMessageStream(text: string): Response {
  const encoder = new TextEncoder();
  const messageId = `cache_${Date.now().toString(36)}`;
  const textId = `t_${Math.random().toString(36).slice(2, 8)}`;
  const events: Array<Record<string, unknown>> = [
    { type: "start", messageId },
    { type: "text-start", id: textId },
  ];
  // Chunk into small slices for a streaming feel
  const chunkSize = 24;
  for (let i = 0; i < text.length; i += chunkSize) {
    events.push({ type: "text-delta", id: textId, delta: text.slice(i, i + chunkSize) });
  }
  events.push({ type: "text-end", id: textId });
  events.push({ type: "finish" });

  const stream = new ReadableStream({
    async start(controller) {
      for (const ev of events) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(ev)}\n\n`));
        // tiny await so the client renders progressively
        await new Promise((r) => setTimeout(r, 8));
      }
      controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      "x-vercel-ai-ui-message-stream": "v1",
      "x-anima-cache": "hit",
    },
  });
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const requestId =
          request.headers.get("x-request-id") ||
          (globalThis.crypto?.randomUUID?.() ?? `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`);
        const model = "google/gemini-3-flash-preview";
        const logError = async (status: number, error_message: string, meta?: Record<string, unknown>) => {
          try {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            await supabaseAdmin.from("ai_errors").insert({
              request_id: requestId,
              route: "/api/chat",
              status,
              model,
              kind: "chat",
              error_message: error_message.slice(0, 2000),
              meta: meta ? (JSON.parse(JSON.stringify(meta)) as never) : null,
            });
          } catch (e) {
            console.error("[chat] failed to log error", e);
          }
        };

        const ip = clientIp(request);
        const rl = rateLimit(`chat:${ip}`, 20, 60_000);
        if (!rl.ok) {
          await logError(429, `rate_limited ip=${ip}`);
          return new Response(JSON.stringify({ error: "rate_limited", retryAfter: rl.resetSeconds, requestId }), {
            status: 429,
            headers: {
              "content-type": "application/json",
              "x-request-id": requestId,
              "retry-after": String(rl.resetSeconds),
              ...rateLimitHeaders(rl),
            },
          });
        }

        try {
          const body = (await request.json().catch(() => null)) as { messages?: UIMessage[] } | null;
          if (!body || !Array.isArray(body.messages)) {
            await logError(400, "messages array required");
            return new Response(JSON.stringify({ error: "messages array required", requestId }), {
              status: 400,
              headers: { "content-type": "application/json", "x-request-id": requestId },
            });
          }

          const messages = body.messages;
          const key = process.env.LOVABLE_API_KEY;
          if (!key) {
            await logError(500, "Missing LOVABLE_API_KEY");
            return new Response(JSON.stringify({
              error: "ai_not_configured",
              message: "LOVABLE_API_KEY is not set on this server. If you deployed to Vercel, add it under Project Settings → Environment Variables and redeploy. The key is auto-provisioned on Lovable but not on external hosts.",
              requestId,
            }), {
              status: 500,
              headers: { "content-type": "application/json", "x-request-id": requestId },
            });
          }

          // ---- Single-turn cache lookup ----
          // Only cache when there is exactly one user message (a fresh question with no prior context).
          const userMessages = messages.filter((m) => m.role === "user");
          const isSingleTurn = userMessages.length === 1 && messages.length <= 2;
          const lastUserText = extractText(userMessages[userMessages.length - 1]?.parts);
          const cacheKey = isSingleTurn && lastUserText.trim().length > 0 ? hashPrompt(lastUserText) : null;

          if (cacheKey) {
            try {
              const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
              const { data: cached } = await supabaseAdmin
                .from("chat_cache")
                .select("response_text, hit_count")
                .eq("prompt_hash", cacheKey)
                .maybeSingle();
              if (cached?.response_text) {
                // best-effort hit_count bump
                void supabaseAdmin
                  .from("chat_cache")
                  .update({ hit_count: (cached.hit_count ?? 1) + 1 })
                  .eq("prompt_hash", cacheKey);
                const res = cachedUIMessageStream(cached.response_text);
                res.headers.set("x-request-id", requestId);
                for (const [k, v] of Object.entries(rateLimitHeaders(rl))) res.headers.set(k, v);
                return res;
              }
            } catch (e) {
              console.warn("[chat] cache lookup failed", e);
            }
          }

          const gateway = createLovableAiGatewayProvider(key, request.headers.get("x-lovable-aig-run-id") ?? undefined);
          let fullText = "";
          const result = streamText({
            model: gateway(model),
            system: SYSTEM,
            messages: await convertToModelMessages(messages),
            onError: ({ error }) => {
              const msg = error instanceof Error ? error.message : String(error);
              void logError(502, `stream error: ${msg}`);
            },
            onChunk: ({ chunk }) => {
              if (chunk.type === "text-delta") fullText += chunk.text;
            },
            onFinish: async () => {
              if (!cacheKey || !fullText.trim()) return;
              try {
                const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
                await supabaseAdmin.from("chat_cache").upsert(
                  {
                    prompt_hash: cacheKey,
                    prompt_preview: lastUserText.slice(0, 300),
                    response_text: fullText,
                    model,
                  },
                  { onConflict: "prompt_hash" },
                );
              } catch (e) {
                console.warn("[chat] cache write failed", e);
              }
            },
          });

          const response = result.toUIMessageStreamResponse({ originalMessages: messages });
          response.headers.set("x-request-id", requestId);
          response.headers.set("x-anima-cache", "miss");
          const runId = gateway.getRunId();
          if (runId) response.headers.set("x-lovable-aig-run-id", runId);
          for (const [k, v] of Object.entries(rateLimitHeaders(rl))) response.headers.set(k, v);
          return response;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("[chat] handler error", requestId, msg);
          await logError(500, msg);
          return new Response(JSON.stringify({ error: "Chat failure", requestId }), {
            status: 500,
            headers: { "content-type": "application/json", "x-request-id": requestId },
          });
        }
      },
    },
  },
});
