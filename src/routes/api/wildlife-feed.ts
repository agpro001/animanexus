import { createFileRoute } from "@tanstack/react-router";

/**
 * Public real-time wildlife/habitat threat feed.
 * Sources (no API key required):
 *  - NASA EONET (Earth Observatory Natural Event Tracker): fires, storms, floods, drought, volcanoes.
 *  - USGS earthquakes (significant past week) as a habitat-disruption signal.
 * Both endpoints are CORS-friendly and free to use.
 */

type Threat = {
  id: string;
  source: "EONET" | "USGS";
  category: string;
  severity: number; // 1..5
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
        geometry?: Array<{ date: string; coordinates: number[]; type: string }>;
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

let cache: { ts: number; data: Threat[] } | null = null;
const TTL_MS = 60_000;

export const Route = createFileRoute("/api/wildlife-feed")({
  server: {
    handlers: {
      GET: async () => {
        const now = Date.now();
        if (cache && now - cache.ts < TTL_MS) {
          return Response.json({ threats: cache.data, cached: true, ts: cache.ts });
        }
        const [eonet, quakes] = await Promise.all([fetchEonet(), fetchQuakes()]);
        const data = [...eonet, ...quakes].sort((a, b) => b.severity - a.severity || (a.date < b.date ? 1 : -1));
        cache = { ts: now, data };
        return new Response(JSON.stringify({ threats: data, cached: false, ts: now }), {
          status: 200,
          headers: {
            "content-type": "application/json",
            "cache-control": "public, max-age=30, s-maxage=60",
          },
        });
      },
    },
  },
});