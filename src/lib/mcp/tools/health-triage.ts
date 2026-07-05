import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "animal_health_triage",
  title: "Animal health triage",
  description: "AI-powered symptom triage for a pet or animal. Returns a plain-language assessment, urgency label (routine / soon / urgent / emergency), and next steps. Always advises consulting a vet for anything serious.",
  inputSchema: {
    species: z.string().describe("Species or breed, e.g. 'dog', 'cat', 'parrot', 'labrador'."),
    symptoms: z.string().describe("Describe the observed symptoms and their duration."),
    ageYears: z.number().optional().describe("Animal age in years, if known."),
  },
  annotations: { readOnlyHint: true, idempotentHint: false, openWorldHint: false },
  handler: async ({ species, symptoms, ageYears }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) {
      return {
        content: [{ type: "text", text: "AI gateway not configured (missing LOVABLE_API_KEY)." }],
        isError: true,
      };
    }
    const prompt = `Triage this animal: species=${species}${ageYears ? `, age=${ageYears}y` : ""}. Symptoms: ${symptoms}\n\nReturn a concise assessment with:\n- urgency: routine | soon | urgent | emergency\n- likely causes (top 3)\n- home stabilization steps\n- when to see a vet\nAlways remind the user this is not a substitute for a veterinarian.`;
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are the ANIMA Nexus health triage AI. Be warm, precise, and safety-first." },
          { role: "user", content: prompt },
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