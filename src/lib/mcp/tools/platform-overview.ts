import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

const MODULES = [
  { key: "twin", path: "/twin", name: "Digital Twin Core", description: "3D biological model of an animal with live health telemetry (heart rate, temperature, stress, activity)." },
  { key: "health", path: "/health", name: "Health AI / Triage", description: "Computer vision on skin/eye/gait photos + symptom checker. Returns risk_label, observations, next_steps." },
  { key: "lost", path: "/lost", name: "Lost Pet Recovery", description: "Facial recognition for animals, sighting reports, predictive movement radar map." },
  { key: "shelter", path: "/shelter", name: "Shelter Nexus", description: "AI compatibility matching between adopters and animals (0-100 fit score)." },
  { key: "wildlife", path: "/wildlife", name: "Wildlife Guardian", description: "Real-time habitat threat feed (NASA EONET + USGS) with AI severity classifier for community reports." },
  { key: "audio", path: "/audio", name: "Audio Insight", description: "Analyses bark/meow/vocal samples for likely emotion and species hints." },
  { key: "emergency", path: "/emergency", name: "Emergency Response", description: "Instant SOS, geolocation routing to nearest vet, AI first-aid steps." },
  { key: "analytics", path: "/analytics", name: "Impact Analytics", description: "Live counts of twins, reunions, threats resolved." },
  { key: "admin", path: "/admin", name: "Admin / NGO Dashboard", description: "Large-scale management view for conservation groups." },
] as const;

export default defineTool({
  name: "platform_overview",
  title: "ANIMA Nexus platform overview",
  description: "Returns the list of ANIMA Nexus modules, their routes, and what each one does. Use this to help users find the right feature.",
  inputSchema: {
    module: z
      .enum(["twin", "health", "lost", "shelter", "wildlife", "audio", "emergency", "analytics", "admin"])
      .optional()
      .describe("Optional single module key to fetch. Omit to list all modules."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ module }) => {
    const data = module ? MODULES.filter((m) => m.key === module) : MODULES;
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { modules: data },
    };
  },
});