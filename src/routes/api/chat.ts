import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const SYSTEM = `You are the ANIMA Nexus Assistant — a warm, expert AI guardian inside a futuristic animal protection platform.

Your job:
- Help users understand and protect their pets, shelter animals, livestock, service animals, and wildlife.
- Explain platform modules: Digital Twin, Health AI, Lost Pet Recovery, Shelter Matching, Wildlife Guardian, Audio Analysis, Emergency Response.
- Give clear, actionable advice on animal health, behavior, safety, rescue, and emergencies.
- For urgent symptoms (poison, heatstroke, severe injury, seizure, bloat, difficulty breathing): tell the user to contact a vet or emergency animal hospital IMMEDIATELY, then provide stabilization steps.
- Be concise, kind, and confident. Use short paragraphs and bullets. Format with markdown.
- Never claim to replace a veterinarian or wildlife expert. Always recommend professional help for serious concerns.

Tone: futuristic but human; like a calm mission-control specialist who genuinely loves animals.`;

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
              request_id: requestId, route: "/api/chat", status, model, kind: "chat",
              error_message: error_message.slice(0, 2000),
              meta: meta ? (JSON.parse(JSON.stringify(meta)) as never) : null,
            });
          } catch (e) { console.error("[chat] failed to log error", e); }
        };
        try {
          const body = (await request.json().catch(() => null)) as { messages?: UIMessage[] } | null;
          if (!body || !Array.isArray(body.messages)) {
            await logError(400, "messages array required");
            return new Response(JSON.stringify({ error: "messages array required", requestId }), {
              status: 400, headers: { "content-type": "application/json", "x-request-id": requestId },
            });
          }
          const messages = body.messages;
          const key = process.env.LOVABLE_API_KEY;
          if (!key) {
            await logError(500, "Missing LOVABLE_API_KEY");
            return new Response(JSON.stringify({ error: "AI gateway not configured", requestId }), {
              status: 500, headers: { "content-type": "application/json", "x-request-id": requestId },
            });
          }
          const gateway = createLovableAiGatewayProvider(key);
          const result = streamText({
            model: gateway(model),
            system: SYSTEM,
            messages: await convertToModelMessages(messages),
            onError: ({ error }) => {
              const msg = error instanceof Error ? error.message : String(error);
              void logError(502, `stream error: ${msg}`);
            },
          });
          const response = result.toUIMessageStreamResponse({ originalMessages: messages });
          response.headers.set("x-request-id", requestId);
          return response;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("[chat] handler error", requestId, msg);
          await logError(500, msg);
          return new Response(JSON.stringify({ error: "Chat failure", requestId }), {
            status: 500, headers: { "content-type": "application/json", "x-request-id": requestId },
          });
        }
      },
    },
  },
});