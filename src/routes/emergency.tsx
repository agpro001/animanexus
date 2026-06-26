import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, PageSection } from "@/components/anima/page";
import { GlassCard, NeonButton, GhostButton, FadeIn } from "@/components/anima/ui";
import { Siren, AlertTriangle, Phone, MapPin, Sparkles, X } from "lucide-react";
import { analyze } from "@/lib/anima-helpers";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/emergency")({
  head: () => ({ meta: [{ title: "Emergency Response — ANIMA Nexus" }, { name: "description", content: "One-tap distress: classify urgency, get a time-critical action plan, and find help fast." }] }),
  component: EmergencyPage,
});

const SCENARIOS = [
  { id: "heatstroke", label: "Heatstroke", icon: "☀️" },
  { id: "poisoning", label: "Poisoning", icon: "🧪" },
  { id: "injury", label: "Severe injury", icon: "🩸" },
  { id: "choking", label: "Choking", icon: "😶" },
  { id: "seizure", label: "Seizure", icon: "⚡" },
  { id: "drowning", label: "Near drowning", icon: "💧" },
  { id: "bloat", label: "Bloat / GDV", icon: "🎈" },
  { id: "trauma", label: "Trauma / hit by car", icon: "🚗" },
] as const;

type Plan = { severity: string; countdown_minutes: number; immediate_actions: string[]; do_not: string[]; then_call: string };

function EmergencyPage() {
  const { user } = useAuth();
  const [active, setActive] = useState<typeof SCENARIOS[number] | null>(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [savingReport, setSavingReport] = useState(false);
  const [locating, setLocating] = useState(false);

  const trigger = async (s: typeof SCENARIOS[number]) => {
    setActive(s); setPlan(null); setBusy(true); setReportId(null);
    const r = await analyze<Plan>("emergency", {
      prompt: `Scenario: ${s.label}. Owner notes: ${notes || "none"}. Generate the immediate action plan.`,
    });
    setBusy(false);
    if (r.error) toast.error(r.error);
    if (r.result) {
      setPlan(r.result);
      if (user) {
        const { data } = await supabase.from("emergency_reports").insert({
          owner_id: user.id, scenario: s.label, severity: r.result.severity, notes, action_plan: r.result,
        }).select("id").single();
        if (data?.id) setReportId(data.id);
      }
    }
  };

  const findNearestHelp = () => {
    setLocating(true);
    if (!navigator.geolocation) {
      window.open(`https://www.google.com/maps/search/emergency+veterinary+hospital`, "_blank");
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        window.open(
          `https://www.google.com/maps/search/emergency+veterinary+hospital/@${latitude},${longitude},14z`,
          "_blank",
        );
        setLocating(false);
      },
      () => {
        window.open(`https://www.google.com/maps/search/emergency+veterinary+hospital`, "_blank");
        setLocating(false);
        toast.message("Showing global vet search (location denied)");
      },
      { timeout: 6000 },
    );
  };

  const saveReport = async () => {
    if (!user) { toast.error("Sign in to save reports"); return; }
    if (!active || !plan) return;
    setSavingReport(true);
    try {
      if (reportId) {
        toast.success("Report already saved to your account");
      } else {
        const { data, error } = await supabase.from("emergency_reports").insert({
          owner_id: user.id, scenario: active.label, severity: plan.severity, notes, action_plan: plan,
        }).select("id").single();
        if (error) throw error;
        if (data?.id) setReportId(data.id);
        toast.success("Report saved");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally { setSavingReport(false); }
  };

  return (
    <>
      <PageHeader eyebrow="Module · Emergency Response"
        title={<>Every second <span className="text-gradient">matters.</span></>}
        kicker="Tap the scenario. AI returns an urgency-graded plan with the exact next steps." />
      <PageSection>
        <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
          <FadeIn>
            <GlassCard>
              <h3 className="flex items-center gap-2 font-display text-lg font-semibold"><Siren className="h-5 w-5 text-[var(--neon-pink)]" /> Trigger scenario</h3>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {SCENARIOS.map((s) => (
                  <button key={s.id} onClick={() => trigger(s)}
                    className={`group relative rounded-md border p-3 text-left transition ${active?.id === s.id ? "border-[var(--neon-pink)] bg-[var(--neon-pink)]/15" : "border-white/10 bg-white/5 hover:border-[var(--neon-pink)]/40"}`}>
                    <div className="text-2xl">{s.icon}</div>
                    <div className="mt-1 text-sm font-semibold">{s.label}</div>
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--neon-pink)] opacity-0 group-hover:opacity-100 shadow-[0_0_8px_currentColor]" />
                  </button>
                ))}
              </div>
              <label className="mt-4 block">
                <span className="mb-1 block text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Quick context (optional)</span>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="What's happening?" className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm" />
              </label>
              <div className="mt-3 rounded-md border border-[var(--neon-pink)]/40 bg-[var(--neon-pink)]/5 p-3 text-xs text-foreground/80">
                <div className="flex items-center gap-1 text-[var(--neon-pink)]"><AlertTriangle className="h-3.5 w-3.5" /><span className="font-mono uppercase tracking-widest">Reminder</span></div>
                Call your nearest animal emergency hospital immediately for life-threatening situations. This guidance complements, never replaces, professional care.
              </div>
            </GlassCard>
          </FadeIn>

          <FadeIn delay={0.08}>
            <AnimatePresence mode="wait">
              {!active && (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <GlassCard className="h-full">
                    <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">
                      <div>
                        <div className="mx-auto h-20 w-20 animate-pulse-glow rounded-full border border-[var(--neon-pink)]/40 bg-[var(--neon-pink)]/10 p-5 text-[var(--neon-pink)]">
                          <Siren className="h-full w-full" />
                        </div>
                        <p className="mt-4">Select a scenario to generate the live action plan.</p>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              )}
              {active && (
                <motion.div key={active.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <GlassCard className="relative">
                    <button onClick={() => { setActive(null); setPlan(null); }} className="absolute right-3 top-3 rounded-md border border-white/10 bg-white/5 p-1"><X className="h-3.5 w-3.5" /></button>
                    <div className="flex items-center gap-2"><span className="text-2xl">{active.icon}</span><h3 className="font-display text-xl font-semibold">{active.label}</h3></div>
                    {busy && (
                      <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
                        <div className="h-5 w-5 animate-spin-slow rounded-full border-2 border-[var(--neon-cyan)]/30 border-t-[var(--neon-cyan)]" />
                        AI classifying urgency and building action plan…
                      </div>
                    )}
                    {plan && (
                      <div className="mt-4 space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider ${plan.severity === "critical" ? "border-[var(--color-destructive)]/50 bg-[var(--color-destructive)]/15 text-[var(--color-destructive)]" : "border-[var(--neon-pink)]/40 bg-[var(--neon-pink)]/15 text-[var(--neon-pink)]"}`}>
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current shadow-[0_0_6px_currentColor]" /> {plan.severity}
                          </span>
                          <Countdown minutes={plan.countdown_minutes} />
                        </div>
                        <Section title="Immediate actions" items={plan.immediate_actions} color="var(--neon-cyan)" />
                        <Section title="Do NOT" items={plan.do_not} color="var(--neon-pink)" />
                        <div className="rounded-md border border-[var(--neon-violet)]/40 bg-[var(--neon-violet)]/10 p-3 text-sm">
                          <div className="flex items-center gap-1 text-[var(--neon-violet)]"><Phone className="h-3.5 w-3.5" /><span className="font-mono uppercase tracking-widest text-[10px]">Then call</span></div>
                          <p className="mt-1">{plan.then_call}</p>
                        </div>
                        <div className="flex gap-2">
                          <NeonButton onClick={findNearestHelp} disabled={locating}>
                            <MapPin className="h-4 w-4" /> {locating ? "Locating…" : "Find nearest help"}
                          </NeonButton>
                          <GhostButton onClick={saveReport} disabled={savingReport}>
                            <Sparkles className="h-4 w-4" /> {reportId ? "Saved ✓" : savingReport ? "Saving…" : "Save report"}
                          </GhostButton>
                          {plan.then_call && (
                            <a
                              href={`tel:${plan.then_call.replace(/[^0-9+]/g, "") || ""}`}
                              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--neon-violet)]/40 bg-[var(--neon-violet)]/15 px-3 py-1.5 text-sm text-[var(--neon-violet)] hover:bg-[var(--neon-violet)]/25"
                            >
                              <Phone className="h-4 w-4" /> Call
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </GlassCard>
                </motion.div>
              )}
            </AnimatePresence>
          </FadeIn>
        </div>
      </PageSection>
    </>
  );
}

function Countdown({ minutes }: { minutes: number }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm">
      <span className="font-mono text-[var(--neon-amber)]">~{minutes}m</span>
      <span className="text-xs text-muted-foreground">window of action</span>
    </div>
  );
}

function Section({ title, items, color }: { title: string; items: string[]; color: string }) {
  if (!items?.length) return null;
  return (
    <div className="rounded-md border border-white/10 bg-white/5 p-3">
      <div className="text-xs font-mono uppercase tracking-widest" style={{ color }}>{title}</div>
      <ol className="mt-2 space-y-1.5 text-sm">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2"><span className="mt-0.5 inline-grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px] font-mono" style={{ borderColor: `${color}80`, color }}>{i+1}</span>{it}</li>
        ))}
      </ol>
    </div>
  );
}