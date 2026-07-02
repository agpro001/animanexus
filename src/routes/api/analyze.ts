import { createFileRoute } from "@tanstack/react-router";
import { rateLimit, clientIp, rateLimitHeaders } from "@/lib/rate-limit.server";
import { consumeCredit, getUserFromRequest, paywallResponse } from "@/lib/billing.server";

type Kind = "health_photo" | "audio" | "symptom" | "twin_summary" | "emergency" | "shelter_match" | "wildlife";

type Body = {
  kind: Kind;
  prompt?: string;
  imageDataUrl?: string;
  audio?: { dataBase64: string; format: string };
  context?: Record<string, unknown>;
};

const ANIMA_CONTEXT =
  "Context: You are an AI module inside ANIMA Nexus — an AI-powered animal protection and digital-twin ecosystem covering pets, shelters, wildlife, and emergency response. Be cautious, evidence-based, and animal-welfare first. Never invent facts. Always recommend professional veterinary or wildlife-authority help for serious cases. ";

const SYSTEMS: Record<Kind, string> = {
  health_photo:
    ANIMA_CONTEXT +
    "You are ANIMA Nexus Health AI (visual triage). From the photo and symptoms, classify dermatological, ocular, dental, gait, wound, and body-condition signals. Return ONLY valid JSON with keys: risk_label ('low'|'moderate'|'high'|'critical'), confidence (0-100 integer), summary (one short sentence), observations (array of short strings naming what you visually see), next_steps (array of short strings; first item must be 'See a veterinarian' whenever risk_label is anything other than 'low').",
  audio:
    ANIMA_CONTEXT +
    "You are ANIMA Nexus Audio Insight (animal bioacoustics). From the audio sample (bark, meow, chirp, growl, whimper, howl, etc.), return ONLY valid JSON: species_guess (string), likely_emotion (one of 'calm'|'alert'|'distress'|'playful'|'aggressive'|'content'|'fearful'|'pain'), confidence (0-100), waveform_notes (string describing pitch/rhythm/duration), interpretation (1-2 sentences in plain language), caution (string reminding this is an AI estimate, not a diagnosis).",
  symptom:
    ANIMA_CONTEXT +
    "You are ANIMA Nexus Symptom Triage. Return ONLY valid JSON: risk_label ('low'|'moderate'|'high'|'critical'), confidence (0-100), summary (one sentence), possible_causes (array of short strings), next_steps (array of short imperatives), urgency ('routine'|'soon'|'urgent'|'emergency'). For poison, heatstroke, seizure, bloat/GDV, difficulty breathing, severe bleeding, or hit-by-car set urgency='emergency' and risk_label='critical'.",
  twin_summary:
    ANIMA_CONTEXT +
    "You are the ANIMA Digital Twin AI. From the animal profile and telemetry, return ONLY valid JSON: ai_summary (2-3 sentence wellness narrative), risk_label, stress_score (0-100), activity_score (0-100), suggested_actions (array of exactly 3 short, actionable strings the guardian can do today).",
  emergency:
    ANIMA_CONTEXT +
    "You are ANIMA Nexus Emergency Response. Treat every input as time-critical. Return ONLY valid JSON: severity ('high'|'critical'), countdown_minutes (integer minutes the user has before things get worse), immediate_actions (array of 4-6 short imperatives in execution order), do_not (array of 2-3 short strings of common mistakes to avoid), then_call (string — who to call after stabilising, e.g. 'Call nearest 24/7 emergency vet').",
  shelter_match:
    ANIMA_CONTEXT +
    "You are ANIMA Shelter Nexus Compatibility AI. Given an adopter profile and an animal, return ONLY valid JSON: score (0-100 overall match), lifestyle_fit (0-100), energy_fit (0-100), home_fit (0-100), reasoning (1-2 sentences), concerns (array of short risk flags, [] if none).",
  wildlife:
    ANIMA_CONTEXT +
    "You are ANIMA Wildlife Guardian threat classifier. Inputs may include text, NASA EONET / USGS context, and user reports of fire, drought, flood, poaching, injury, deforestation. Return ONLY valid JSON: severity (integer 1-5, where 5=catastrophic), threat_type (string), recommended_response (one sentence — what conservation/NGO/authority action to take), risk_radius_km (number).",
};

export const Route = createFileRoute("/api/analyze")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const requestId =
          request.headers.get("x-request-id") ||
          (globalThis.crypto?.randomUUID?.() ?? `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`);
        const model = "google/gemini-2.5-flash-lite";
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

        // Auth + entitlement gate
        const user = await getUserFromRequest(request);
        if (!user) {
          await logError(401, kind, "auth_required");
          return paywallResponse(requestId, 401, "auth_required");
        }
        let consumed;
        try { consumed = await consumeCredit(user.id); }
        catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          await logError(500, kind, `credit_check_failed: ${msg}`);
          return respond(500, { error: "credit_check_failed", detail: msg });
        }
        if (!consumed.ok) {
          await logError(402, kind, "paywall");
          return paywallResponse(requestId, 402, "paywall");
        }

        const userContent: Array<Record<string, unknown>> = [];
        const userText = [prompt, context ? `Context: ${JSON.stringify(context)}` : null].filter(Boolean).join("\n\n");
        if (userText) userContent.push({ type: "text", text: userText });
        if (imageDataUrl) userContent.push({ type: "image_url", image_url: { url: imageDataUrl } });
        if (audio?.dataBase64) userContent.push({ type: "input_audio", input_audio: { data: audio.dataBase64, format: audio.format } });
        if (userContent.length === 0) userContent.push({ type: "text", text: "Analyze this case." });

        try {
          const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.LOVABLE_API_KEY || ""}`,
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
