import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, PageSection } from "@/components/anima/page";
import { GlassCard, FadeIn, NeonButton } from "@/components/anima/ui";
import { Globe2, Flame, Droplet, AlertTriangle, Trees, Skull } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { analyze } from "@/lib/anima-helpers";
import { toast } from "sonner";

export const Route = createFileRoute("/wildlife")({
  head: () => ({ meta: [{ title: "Wildlife Guardian — ANIMA Nexus" }, { name: "description", content: "Conservation command center: habitat threats, climate risk, poaching alerts." }] }),
  component: WildlifePage,
});

type Alert = { id: string; zone_name: string; threat: string; severity: number; description: string|null; status: string; created_at: string };
type LiveThreat = { id: string; source: string; category: string; severity: number; title: string; lat: number; lon: number; date: string; link?: string };

const THREATS = [
  { id: "fire", icon: Flame, color: "var(--neon-pink)", label: "Fire" },
  { id: "drought", icon: Droplet, color: "var(--neon-amber)", label: "Drought" },
  { id: "poaching", icon: Skull, color: "var(--neon-pink)", label: "Poaching" },
  { id: "flood", icon: Droplet, color: "var(--neon-cyan)", label: "Flood" },
  { id: "deforestation", icon: Trees, color: "var(--neon-emerald)", label: "Deforestation" },
] as const;

function categoryIcon(cat: string) {
  const c = cat.toLowerCase();
  if (c.includes("fire")) return Flame;
  if (c.includes("flood") || c.includes("water")) return Droplet;
  if (c.includes("storm") || c.includes("temp")) return AlertTriangle;
  if (c.includes("earth") || c.includes("volcano") || c.includes("landslide")) return Globe2;
  return Trees;
}

function WildlifePage() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [live, setLive] = useState<LiveThreat[]>([]);
  const [liveTs, setLiveTs] = useState<number | null>(null);
  const [liveLoading, setLiveLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("wildlife_alerts").select("*").order("created_at", { ascending: false }).limit(20);
    setAlerts((data as Alert[]) ?? []);
  };
  const loadLive = async () => {
    try {
      setLiveLoading(true);
      const r = await fetch("/api/wildlife-feed", { headers: { Accept: "application/json" } });
      const j = (await r.json()) as { threats: LiveThreat[]; ts: number };
      setLive(j.threats ?? []);
      setLiveTs(j.ts ?? Date.now());
    } catch (e) {
      console.error("wildlife feed failed", e);
    } finally { setLiveLoading(false); }
  };
  useEffect(() => {
    load(); loadLive();
    const id = setInterval(loadLive, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <PageHeader eyebrow="Module · Wildlife Guardian" title={<>Conservation, <span className="text-gradient">in command.</span></>}
        kicker="Live habitat threats from NASA EONET and USGS, combined with on-platform poaching reports and AI severity scoring.">
        {user && <div className="mt-6"><NeonButton onClick={() => setReportOpen(true)}>Report a threat</NeonButton></div>}
      </PageHeader>
      <PageSection>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-[var(--neon-emerald)]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--neon-emerald)] shadow-[0_0_8px_currentColor]" />
            Live feed · NASA EONET + USGS · {live.length} active events
          </div>
          <span className="text-[11px] text-muted-foreground">{liveTs ? `updated ${new Date(liveTs).toLocaleTimeString()}` : liveLoading ? "loading…" : ""}</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {liveLoading && live.length === 0 ? (
            Array.from({ length: 6 }).map((_, i) => (
              <GlassCard key={i}><div className="h-24 animate-pulse rounded bg-white/5" /></GlassCard>
            ))
          ) : live.length === 0 ? (
            <GlassCard className="sm:col-span-2 lg:col-span-3 text-center text-sm text-muted-foreground">
              No active global events reported by NASA EONET in the last 20 days.
            </GlassCard>
          ) : live.slice(0, 9).map((t, i) => {
            const Icon = categoryIcon(t.category);
            const color = t.severity >= 5 ? "var(--neon-pink)" : t.severity >= 4 ? "var(--neon-amber)" : "var(--neon-cyan)";
            return (
              <FadeIn key={t.id} delay={i * 0.04}>
                <GlassCard glow="cyan">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5" style={{ color }} />
                      <div className="font-display text-sm font-semibold">{t.category}</div>
                    </div>
                    <span className="rounded-full border px-2 py-0.5 text-[10px] font-mono" style={{ borderColor: `${color}55`, color }}>
                      sev {t.severity}/5
                    </span>
                  </div>
                  <div className="mt-2 line-clamp-2 text-sm text-foreground/90">{t.title}</div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="font-mono">{t.lat.toFixed(2)}°, {t.lon.toFixed(2)}°</span>
                    <span>{new Date(t.date).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="font-mono uppercase tracking-widest">{t.source}</span>
                    {t.link && <a href={t.link} target="_blank" rel="noreferrer" className="text-[var(--neon-cyan)] hover:underline">source ↗</a>}
                  </div>
                </GlassCard>
              </FadeIn>
            );
          })}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <GlassCard>
            <h3 className="flex items-center gap-2 font-display text-lg font-semibold"><AlertTriangle className="h-5 w-5 text-[var(--neon-amber)]" /> Recent community alerts</h3>
            <div className="mt-3 space-y-2">
              {alerts.length === 0 ? <div className="text-sm text-muted-foreground">No live alerts. Report one above.</div> :
                alerts.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-md border border-white/10 bg-white/5 p-2">
                    <div className={`h-8 w-8 rounded-md ${a.severity >= 4 ? "bg-[var(--neon-pink)]/20 text-[var(--neon-pink)]" : "bg-[var(--neon-amber)]/20 text-[var(--neon-amber)]"} grid place-items-center text-[10px] font-mono`}>{a.severity}</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{a.zone_name} · <span className="text-muted-foreground">{a.threat}</span></div>
                      <div className="text-xs text-muted-foreground">{a.description}</div>
                    </div>
                  </div>
                ))}
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="flex items-center gap-2 font-display text-lg font-semibold"><Globe2 className="h-5 w-5 text-[var(--neon-cyan)]" /> Live threat heatmap</h3>
            <Heatmap points={live} />
          </GlassCard>
        </div>
      </PageSection>

      {reportOpen && user && <ReportForm onClose={() => setReportOpen(false)} onSaved={() => { setReportOpen(false); load(); }} userId={user.id} />}
    </>
  );
}

function Heatmap({ points }: { points: LiveThreat[] }) {
  const pts = points.slice(0, 40);
  return (
    <div className="relative mt-3 h-64 overflow-hidden rounded-md border border-white/10 bg-[oklch(0.1_0.025_260)]">
      <iframe
        title="Windy global threat overlay"
        src="https://embed.windy.com/embed2.html?lat=20&lon=0&zoom=2&level=surface&overlay=temp&menu=&message=&marker=&calendar=&pressure=&type=map&location=coordinates&metricWind=default&metricTemp=default&radarRange=-1"
        className="absolute inset-0 h-full w-full"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,oklch(0.05_0.02_260/0.65)_100%)]" />
      {pts.length === 0 && (
        <div className="absolute inset-0 grid place-items-center text-xs text-muted-foreground">Awaiting live signal…</div>
      )}
      {pts.map((p) => {
        const x = ((p.lon + 180) / 360) * 100;
        const y = ((90 - p.lat) / 180) * 100;
        const c = p.severity >= 5 ? "var(--neon-pink)" : p.severity >= 4 ? "var(--neon-amber)" : "var(--neon-cyan)";
        const size = 30 + p.severity * 14;
        return (
          <div key={p.id} title={p.title} className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full" style={{
            left: `${x}%`, top: `${y}%`,
            width: size, height: size,
            background: `radial-gradient(circle, ${c}66, transparent 70%)`,
            filter: "blur(2px)",
          }} />
        );
      })}
      <div className="absolute right-2 top-2 rounded border border-[var(--neon-cyan)]/40 bg-black/60 px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-[var(--neon-cyan)] backdrop-blur">
        Windy.com · {pts.length} live events
      </div>
    </div>
  );
}

function ReportForm({ onClose, onSaved, userId }: { onClose: () => void; onSaved: () => void; userId: string }) {
  const [form, setForm] = useState({ zone_name: "", threat: "fire", description: "" });
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const ai = await analyze<{ severity: number; threat_type: string; recommended_response: string }>("wildlife", {
      prompt: `Wildlife threat report: ${form.threat} in ${form.zone_name}. ${form.description}`,
    });
    const sev = Math.max(1, Math.min(5, Math.round(ai.result?.severity ?? 3)));
    const { error } = await supabase.from("wildlife_alerts").insert({
      reporter_id: userId, zone_name: form.zone_name, threat: form.threat, severity: sev, description: form.description,
    });
    setBusy(false);
    if (error) toast.error(error.message); else { toast.success(`Alert filed · severity ${sev}/5`); onSaved(); }
  };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-6 backdrop-blur" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="glass-strong w-full max-w-md space-y-3 rounded-xl p-6">
        <h3 className="font-display text-xl font-semibold">Report wildlife threat</h3>
        <input required value={form.zone_name} onChange={(e) => setForm({ ...form, zone_name: e.target.value })} placeholder="Zone name" className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm" />
        <select value={form.threat} onChange={(e) => setForm({ ...form, threat: e.target.value })} className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm">
          {["fire","drought","flood","poaching","injury","deforestation"].map((t) => <option key={t}>{t}</option>)}
        </select>
        <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Describe what you observed…" className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm" />
        <NeonButton type="submit" disabled={busy} className="w-full">{busy ? "Classifying…" : "Submit for AI classification"}</NeonButton>
      </form>
    </div>
  );
}