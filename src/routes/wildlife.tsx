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

const SEED_ZONES = [
  { name: "Serengeti N4", health: 71, threats: ["drought","poaching"] },
  { name: "Borneo Lowland", health: 58, threats: ["fire","deforestation"] },
  { name: "Amazonia Sector 7", health: 64, threats: ["fire","drought"] },
  { name: "Yellowstone E", health: 88, threats: [] },
  { name: "Iberian Lynx Range", health: 79, threats: ["road"] },
  { name: "Sundarbans", health: 52, threats: ["flood","poaching"] },
];

const THREATS = [
  { id: "fire", icon: Flame, color: "var(--neon-pink)", label: "Fire" },
  { id: "drought", icon: Droplet, color: "var(--neon-amber)", label: "Drought" },
  { id: "poaching", icon: Skull, color: "var(--neon-pink)", label: "Poaching" },
  { id: "flood", icon: Droplet, color: "var(--neon-cyan)", label: "Flood" },
  { id: "deforestation", icon: Trees, color: "var(--neon-emerald)", label: "Deforestation" },
] as const;

function WildlifePage() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [reportOpen, setReportOpen] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("wildlife_alerts").select("*").order("created_at", { ascending: false }).limit(20);
    setAlerts((data as Alert[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  return (
    <>
      <PageHeader eyebrow="Module · Wildlife Guardian" title={<>Conservation, <span className="text-gradient">in command.</span></>}
        kicker="Habitat health scoring, climate threats, and poaching alerts — visualized as a live mission map.">
        {user && <div className="mt-6"><NeonButton onClick={() => setReportOpen(true)}>Report a threat</NeonButton></div>}
      </PageHeader>
      <PageSection>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SEED_ZONES.map((z, i) => (
            <FadeIn key={z.name} delay={i * 0.05}>
              <GlassCard glow="cyan">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><Globe2 className="h-5 w-5 text-[var(--neon-emerald)]" /><div className="font-display text-sm font-semibold">{z.name}</div></div>
                  <span className={`text-xs font-mono ${z.health > 75 ? "text-[var(--neon-emerald)]" : z.health > 60 ? "text-[var(--neon-amber)]" : "text-[var(--neon-pink)]"}`}>{z.health}%</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full" style={{ width: `${z.health}%`, background: z.health > 75 ? "var(--neon-emerald)" : z.health > 60 ? "var(--neon-amber)" : "var(--neon-pink)" }} />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {z.threats.length === 0 ? <span className="text-xs text-muted-foreground">No active threats</span> : z.threats.map((t) => {
                    const T = THREATS.find((x) => x.id === t);
                    if (!T) return null;
                    return <span key={t} className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px]" style={{ borderColor: `${T.color}40`, color: T.color, background: `${T.color}10` }}>
                      <T.icon className="h-3 w-3" /> {T.label}
                    </span>;
                  })}
                </div>
              </GlassCard>
            </FadeIn>
          ))}
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
            <h3 className="flex items-center gap-2 font-display text-lg font-semibold"><Globe2 className="h-5 w-5 text-[var(--neon-cyan)]" /> Threat heatmap</h3>
            <Heatmap />
          </GlassCard>
        </div>
      </PageSection>

      {reportOpen && user && <ReportForm onClose={() => setReportOpen(false)} onSaved={() => { setReportOpen(false); load(); }} userId={user.id} />}
    </>
  );
}

function Heatmap() {
  return (
    <div className="relative mt-3 h-64 overflow-hidden rounded-md border border-white/10 bg-[oklch(0.1_0.025_260)]">
      <div className="absolute inset-0 grid-bg opacity-30" />
      {[
        { x: 15, y: 30, c: "var(--neon-pink)", s: 1 },
        { x: 35, y: 60, c: "var(--neon-amber)", s: 1.4 },
        { x: 65, y: 25, c: "var(--neon-pink)", s: 1.2 },
        { x: 80, y: 70, c: "var(--neon-amber)", s: 0.8 },
        { x: 45, y: 45, c: "var(--neon-emerald)", s: 1 },
      ].map((p, i) => (
        <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full" style={{
          left: `${p.x}%`, top: `${p.y}%`,
          width: 80 * p.s, height: 80 * p.s,
          background: `radial-gradient(circle, ${p.c}55, transparent 70%)`,
          filter: "blur(2px)",
        }} />
      ))}
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