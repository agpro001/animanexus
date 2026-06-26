import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Bell, BellOff, AlertTriangle, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Real-time emergency alerts. Subscribes to wildlife_alerts, sightings, and emergency_reports.
// User picks a city/area; alerts within radius (or globally if no area) trigger toast notifications.

type AreaPref = { name: string; lat: number; lng: number; radiusKm: number; enabled: boolean };
const KEY = "anima:alerts:pref";

function loadPref(): AreaPref {
  if (typeof window === "undefined") return { name: "Global", lat: 0, lng: 0, radiusKm: 0, enabled: true };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as AreaPref;
  } catch { /* ignore */ }
  return { name: "Global", lat: 0, lng: 0, radiusKm: 0, enabled: true };
}

function distKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export function RealtimeAlerts() {
  const [pref, setPref] = useState<AreaPref>(() => loadPref());
  const [panel, setPanel] = useState(false);
  const [count, setCount] = useState(0);
  const prefRef = useRef(pref);
  useEffect(() => { prefRef.current = pref; try { localStorage.setItem(KEY, JSON.stringify(pref)); } catch { /* ignore */ } }, [pref]);

  useEffect(() => {
    const channel = supabase
      .channel("anima-alerts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "wildlife_alerts" }, (p) => {
        const r = p.new as { zone_name?: string; threat?: string; severity?: number; lat?: number; lng?: number };
        const cur = prefRef.current;
        if (!cur.enabled) return;
        if (cur.radiusKm > 0 && r.lat != null && r.lng != null) {
          if (distKm({ lat: cur.lat, lng: cur.lng }, { lat: r.lat, lng: r.lng }) > cur.radiusKm) return;
        }
        toast(`Wildlife alert · sev ${r.severity ?? "?"}/5`, {
          description: `${r.threat ?? "threat"} reported near ${r.zone_name ?? "unknown zone"}`,
          icon: "⚠️",
        });
        setCount((c) => c + 1);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "sightings" }, (p) => {
        const r = p.new as { description?: string; lat?: number; lng?: number };
        const cur = prefRef.current;
        if (!cur.enabled) return;
        if (cur.radiusKm > 0 && r.lat != null && r.lng != null) {
          if (distKm({ lat: cur.lat, lng: cur.lng }, { lat: r.lat, lng: r.lng }) > cur.radiusKm) return;
        }
        toast("New sighting reported", { description: r.description?.slice(0, 120) ?? "Possible lost animal nearby", icon: "👁" });
        setCount((c) => c + 1);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "emergency_reports" }, (p) => {
        const r = p.new as { issue?: string; lat?: number; lng?: number };
        const cur = prefRef.current;
        if (!cur.enabled) return;
        if (cur.radiusKm > 0 && r.lat != null && r.lng != null) {
          if (distKm({ lat: cur.lat, lng: cur.lng }, { lat: r.lat, lng: r.lng }) > cur.radiusKm) return;
        }
        toast("Emergency reported nearby", { description: r.issue ?? "Animal in distress", icon: "🚨" });
        setCount((c) => c + 1);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const useMyLocation = () => {
    if (!navigator.geolocation) { toast.error("Geolocation unavailable"); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => { setPref({ ...prefRef.current, name: "My location", lat: p.coords.latitude, lng: p.coords.longitude, radiusKm: prefRef.current.radiusKm || 50 }); toast.success("Alert area set to your location"); },
      () => toast.error("Couldn't get location"),
    );
  };

  return (
    <>
      <motion.button
        onClick={() => { setPanel((p) => !p); setCount(0); }}
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.7, type: "spring" }}
        className="fixed bottom-5 right-[5.5rem] z-50 flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-[oklch(0.13_0.03_265)] text-foreground shadow-lg"
        aria-label="Realtime alerts">
        {pref.enabled ? <Bell className="h-5 w-5 text-[var(--neon-amber)]" /> : <BellOff className="h-5 w-5 text-muted-foreground" />}
        {count > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-[var(--neon-pink)] px-1 text-[10px] font-bold text-black">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {panel && (
          <motion.div initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.97 }}
            className="glass-strong fixed bottom-[5.5rem] right-[5.5rem] z-50 w-[min(92vw,340px)] space-y-3 rounded-xl border border-white/15 p-4 text-sm shadow-2xl">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[var(--neon-amber)]" />
              <div className="font-display text-sm font-semibold">Real-time alert area</div>
            </div>
            <p className="text-xs text-muted-foreground">Get instant notifications when wildlife threats, sightings, or emergencies are reported near you.</p>
            <label className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs">
              <span>Notifications</span>
              <input type="checkbox" checked={pref.enabled} onChange={(e) => setPref({ ...pref, enabled: e.target.checked })} />
            </label>
            <div className="rounded-md border border-white/10 bg-white/5 p-2">
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                <MapPin className="h-3 w-3" /> Area
              </div>
              <div className="mt-1 font-mono text-xs">
                {pref.radiusKm > 0 ? `${pref.name} · ${pref.lat.toFixed(2)}, ${pref.lng.toFixed(2)} · ${pref.radiusKm} km` : "Global (all reports)"}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <button onClick={useMyLocation} className="rounded border border-[var(--neon-cyan)]/40 bg-[var(--neon-cyan)]/10 px-2 py-1 text-[10px] text-[var(--neon-cyan)]">Use my location</button>
                <button onClick={() => setPref({ ...pref, name: "Global", lat: 0, lng: 0, radiusKm: 0 })} className="rounded border border-white/15 bg-white/5 px-2 py-1 text-[10px]">Global</button>
              </div>
              {pref.radiusKm > 0 && (
                <div className="mt-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Radius · {pref.radiusKm} km</label>
                  <input type="range" min={5} max={500} value={pref.radiusKm} onChange={(e) => setPref({ ...pref, radiusKm: Number(e.target.value) })} className="w-full accent-[var(--neon-cyan)]" />
                </div>
              )}
            </div>
            <Link to="/emergency" onClick={() => setPanel(false)} className="block rounded-md border border-[var(--neon-pink)]/40 bg-[var(--neon-pink)]/10 px-3 py-2 text-center text-xs font-mono uppercase tracking-widest text-[var(--neon-pink)]">
              Open emergency centre →
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}