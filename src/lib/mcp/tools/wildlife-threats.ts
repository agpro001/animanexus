import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

type Threat = {
  id: string;
  source: "EONET" | "USGS";
  category: string;
  severity: number;
  title: string;
  lat: number;
  lon: number;
  date: string;
  link?: string;
};

const CATEGORY_SEVERITY: Record<string, number> = {
  wildfires: 5, severeStorms: 4, floods: 4, drought: 3, volcanoes: 5,
  seaLakeIce: 2, landslides: 4, snow: 2, tempExtremes: 3, dustHaze: 2,
  manmade: 3, waterColor: 2,
};

async function fetchEonet(): Promise<Threat[]> {
  try {
    const r = await fetch("https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=40&days=20", {
      headers: { Accept: "application/json" },
    });
    if (!r.ok) return [];
    const j = (await r.json()) as {
      events?: Array<{
        id: string; title: string;
        categories?: { id: string; title: string }[];
        geometry?: Array<{ date: string; coordinates: number[] }>;
        sources?: { url: string }[];
      }>;
    };
    const out: Threat[] = [];
    for (const e of j.events ?? []) {
      const g = e.geometry?.[e.geometry.length - 1];
      if (!g || !g.coordinates || g.coordinates.length < 2) continue;
      const [lon, lat] = g.coordinates as [number, number];
      const cat = e.categories?.[0]?.id ?? "manmade";
      out.push({
        id: `eonet_${e.id}`, source: "EONET",
        category: e.categories?.[0]?.title ?? cat,
        severity: CATEGORY_SEVERITY[cat] ?? 3,
        title: e.title, lat, lon, date: g.date,
        link: e.sources?.[0]?.url,
      });
    }
    return out;
  } catch { return []; }
}

async function fetchQuakes(): Promise<Threat[]> {
  try {
    const r = await fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_week.geojson");
    if (!r.ok) return [];
    const j = (await r.json()) as {
      features?: Array<{
        id: string;
        properties: { mag: number; place: string; time: number; url: string };
        geometry: { coordinates: number[] };
      }>;
    };
    return (j.features ?? []).map((f) => {
      const mag = f.properties.mag ?? 0;
      const sev = mag >= 7 ? 5 : mag >= 6 ? 4 : mag >= 5 ? 3 : 2;
      const [lon, lat] = f.geometry.coordinates as [number, number, number];
      return {
        id: `usgs_${f.id}`, source: "USGS" as const,
        category: "Earthquake", severity: sev,
        title: `M${mag.toFixed(1)} — ${f.properties.place}`,
        lat, lon, date: new Date(f.properties.time).toISOString(),
        link: f.properties.url,
      };
    });
  } catch { return []; }
}

export default defineTool({
  name: "get_wildlife_threats",
  title: "Get live wildlife threats",
  description: "Fetches ANIMA Nexus Wildlife Guardian's live habitat threat feed: NASA EONET events (fires, storms, floods, drought, volcanoes) and USGS significant earthquakes. Sorted by severity.",
  inputSchema: {
    minSeverity: z.number().int().min(1).max(5).optional().describe("Only return threats with severity >= this value (1-5)."),
    limit: z.number().int().min(1).max(50).optional().describe("Max number of threats to return (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: false, openWorldHint: true },
  handler: async ({ minSeverity, limit }) => {
    const [eonet, quakes] = await Promise.all([fetchEonet(), fetchQuakes()]);
    const min = minSeverity ?? 1;
    const cap = limit ?? 20;
    const threats = [...eonet, ...quakes]
      .filter((t) => t.severity >= min)
      .sort((a, b) => b.severity - a.severity || (a.date < b.date ? 1 : -1))
      .slice(0, cap);
    return {
      content: [{ type: "text", text: JSON.stringify(threats, null, 2) }],
      structuredContent: { count: threats.length, threats },
    };
  },
});