import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
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
        try {
          const { messages } = (await request.json()) as { messages?: UIMessage[] };
          if (!Array.isArray(messages)) return new Response("Messages required", { status: 400 });
          const key = process.env.LOVABLE_API_KEY;
          if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });
          const gateway = createLovableAiGatewayProvider(key);
          const result = streamText({
            model: gateway("google/gemini-3-flash-preview"),
            system: SYSTEM,
            messages: await convertToModelMessages(messages),
          });
          return result.toUIMessageStreamResponse({ originalMessages: messages });
        } catch (err) {
          console.error("chat handler error", err);
          return new Response("Chat failure", { status: 500 });
        }
      },
    },
  },
});