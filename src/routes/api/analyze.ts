import { createFileRoute } from "@tanstack/react-router";
import { callLovableAI } from "@/lib/ai-gateway.server";
import { rateLimit, clientIp, rateLimitHeaders } from "@/lib/rate-limit.server";

type Kind = "health_photo" | "audio" | "symptom" | "twin_summary" | "emergency" | "shelter_match" | "wildlife";

type Body = {
  kind: Kind;
  prompt?: string;
  imageDataUrl?: string;
  audio?: { dataBase64: string; format: string };
  context?: Record<string, unknown>;
};

const SYSTEMS: Record<Kind, string> = {
  health_photo:
    "You are a veterinary triage AI. From the photo and symptoms, return a JSON object with keys: risk_label ('low'|'moderate'|'high'|'critical'), confidence (0-100 integer), summary (one short sentence), observations (array of short strings), next_steps (array of short strings). Be cautious. Always remind to consult a vet for anything beyond 'low'. Respond ONLY with valid JSON.",
  audio:
    "You are an animal bioacoustics AI. From the audio sample, return JSON: species_guess (string), likely_emotion (string e.g. 'calm','alert','distress','playful','aggressive','content'), confidence (0-100), waveform_notes (string), interpretation (string), caution (string reminding this is an estimate). Respond ONLY with valid JSON.",
  symptom:
    "You are a veterinary triage AI for symptom logging. Return JSON: risk_label, confidence, summary, possible_causes (array), next_steps (array), urgency ('routine'|'soon'|'urgent'|'emergency'). Respond ONLY with valid JSON.",
  twin_summary:
    "You are the ANIMA twin AI. From the animal details, return JSON: ai_summary (2-3 sentences), risk_label, stress_score (0-100), activity_score (0-100), suggested_actions (array of 3 short strings). Respond ONLY with valid JSON.",
  emergency:
    "You are an animal emergency response AI. Given the scenario, return JSON: severity ('high'|'critical'), countdown_minutes (integer), immediate_actions (array of 4-6 short imperatives), do_not (array of 2-3 short strings), then_call (string). Respond ONLY with valid JSON.",
  shelter_match:
    "You are an adoption compatibility AI. Given an adopter profile and an animal, return JSON: score (0-100), lifestyle_fit (0-100), energy_fit (0-100), home_fit (0-100), reasoning (string), concerns (array). Respond ONLY with valid JSON.",
  wildlife:
    "You are a wildlife conservation threat classifier. Given a report, return JSON: severity (1-5 integer), threat_type (string), recommended_response (string), risk_radius_km (number). Respond ONLY with valid JSON.",
};

export const Route = createFileRoute("/api/analyze")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const requestId =
          request.headers.get("x-request-id") ||
          (globalThis.crypto?.randomUUID?.() ?? `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`);
        const model = "google/gemini-3-flash-preview";
        const logError = async (status: number, kind: string | null, error_message: string, meta?: Record<string, unknown>) => {
          try {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            await supabaseAdmin.from("ai_errors").insert({
              request_id: requestId, route: "/api/analyze", status, model, kind,
              error_message: error_message.slice(0, 2000),
              meta: meta ? (JSON.parse(JSON.stringify(meta)) as never) : null,
            });
          } catch (e) { console.error("[analyze] failed to log error", e); }
        };
        const respond = (status: number, payload: Record<string, unknown>) =>
          new Response(JSON.stringify({ ...payload, requestId }), {
            status, headers: { "content-type": "application/json", "x-request-id": requestId },
          });
        const ip = clientIp(request);
        const rl = rateLimit(`analyze:${ip}`, 15, 60_000);
        if (!rl.ok) {
          await logError(429, null, `rate_limited ip=${ip}`);
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
        let body: Body;
        try { body = (await request.json()) as Body; }
        catch {
          await logError(400, null, "invalid_json");
          return respond(400, { error: "invalid_json" });
        }
        const { kind, prompt, imageDataUrl, audio, context } = body;
        if (!kind || !SYSTEMS[kind]) {
          await logError(400, kind ?? null, "invalid_kind");
          return respond(400, { error: "invalid_kind" });
        }

        const userContent: Array<Record<string, unknown>> = [];
        const userText = [prompt, context ? `Context: ${JSON.stringify(context)}` : null].filter(Boolean).join("\n\n");
        if (userText) userContent.push({ type: "text", text: userText });
        if (imageDataUrl) userContent.push({ type: "image_url", image_url: { url: imageDataUrl } });
        if (audio?.dataBase64) userContent.push({ type: "input_audio", input_audio: { data: audio.dataBase64, format: audio.format } });
        if (userContent.length === 0) userContent.push({ type: "text", text: "Analyze this case." });

        try {
          const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.GROQ_API_KEY || ""}`,
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: "system", content: SYSTEMS[kind] },
                { role: "user", content: userContent },
              ],
              response_format: { type: "json_object" },
            }),
          });
          if (!r.ok) {
            const text = await r.text();
            await logError(r.status, kind, `ai_error: ${text.slice(0, 500)}`);
            return respond(r.status, { error: "ai_error", status: r.status, detail: text });
          }
          const json = (await r.json()) as { choices?: { message?: { content?: string } }[] };
          const content = json.choices?.[0]?.message?.content ?? "{}";
          let parsed: unknown;
          try { parsed = JSON.parse(content); } catch { parsed = { raw: content }; }
          return respond(200, { result: parsed });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error("[analyze] error", requestId, msg);
          await logError(500, kind, msg);
          return respond(500, { error: "server_error", detail: msg });
        }
      },
    },
  },
});
