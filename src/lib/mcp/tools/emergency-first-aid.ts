import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "emergency_first_aid",
  title: "Animal emergency first aid",
  description: "Returns step-by-step first-aid guidance for an animal emergency (poisoning, heatstroke, bleeding, seizure, bloat, hit-by-car, snakebite, etc.). Always starts with 'call your vet or emergency animal hospital NOW'.",
  inputSchema: {
    species: z.string().describe("Species, e.g. 'dog', 'cat', 'horse'."),
    condition: z.string().describe("The emergency condition or what happened, e.g. 'ate chocolate', 'heatstroke', 'hit by car'."),
  },
  annotations: { readOnlyHint: true, idempotentHint: false, openWorldHint: false },
  handler: async ({ species, condition }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) {
      return {
        content: [{ type: "text", text: "AI gateway not configured (missing LOVABLE_API_KEY)." }],
        isError: true,
      };
    }
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are the ANIMA Nexus emergency responder. Reply with: 1) an urgent line telling the caller to contact a vet / emergency animal hospital immediately, 2) numbered stabilization steps, 3) a short 'do NOT' list. Keep it tight and calm." },
          { role: "user", content: `Species: ${species}\nEmergency: ${condition}` },
        ],
      }),
    });
    if (!r.ok) {
      const text = await r.text().catch(() => "");
      return { content: [{ type: "text", text: `AI error ${r.status}: ${text.slice(0, 500)}` }], isError: true };
    }
    const j = (await r.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = j.choices?.[0]?.message?.content ?? "No response.";
    return { content: [{ type: "text", text }] };
  },
});