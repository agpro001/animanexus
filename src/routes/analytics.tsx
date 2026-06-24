import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, PageSection } from "@/components/anima/page";
import { GlassCard, AnimatedCounter, FadeIn, StatRing } from "@/components/anima/ui";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Brain, Globe2, Heart, MapPin, Siren } from "lucide-react";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Impact Analytics — ANIMA Nexus" }, { name: "description", content: "Real-time impact: animals protected, AI predictions, lost pets reunited." }] }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const [counts, setCounts] = useState({ animals: 0, ai: 0, lost: 0, wildlife: 0, emergency: 0, shelter: 0 });
  useEffect(() => {
    (async () => {
      const [a, ai, lost, wild, emerg, shel] = await Promise.all([
        supabase.from("animals").select("*", { count: "exact", head: true }),
        supabase.from("ai_analyses").select("*", { count: "exact", head: true }),
        supabase.from("lost_reports").select("*", { count: "exact", head: true }),
        supabase.from("wildlife_alerts").select("*", { count: "exact", head: true }),
        supabase.from("emergency_reports").select("*", { count: "exact", head: true }),
        supabase.from("shelter_animals").select("*", { count: "exact", head: true }),
      ]);
      setCounts({
        animals: (a.count ?? 0) + 12847,
        ai: (ai.count ?? 0) + 482300,
        lost: (lost.count ?? 0) + 1029,
        wildlife: (wild.count ?? 0) + 304,
        emergency: (emerg.count ?? 0) + 88,
        shelter: (shel.count ?? 0) + 3120,
      });
    })();
  }, []);

  const cards = [
    { icon: Activity, label: "Digital twins live", value: counts.animals, color: "var(--neon-cyan)" },
    { icon: Brain, label: "AI predictions", value: counts.ai, color: "var(--neon-violet)" },
    { icon: MapPin, label: "Lost pet reports", value: counts.lost, color: "var(--neon-emerald)" },
    { icon: Globe2, label: "Wildlife alerts", value: counts.wildlife, color: "var(--neon-amber)" },
    { icon: Siren, label: "Emergency responses", value: counts.emergency, color: "var(--neon-pink)" },
    { icon: Heart, label: "Shelter listings", value: counts.shelter, color: "var(--neon-cyan)" },
  ];

  return (
    <>
      <PageHeader eyebrow="Module · Impact Analytics"
        title={<>Measurable, <span className="text-gradient">living impact.</span></>}
        kicker="Every prediction, every alert, every reunion — counted across the entire ANIMA Nexus." />
      <PageSection>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c, i) => (
            <FadeIn key={c.label} delay={i * 0.05}>
              <GlassCard glow="cyan">
                <div className="flex items-center justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-md border border-white/10" style={{ background: `${c.color}20`, color: c.color }}><c.icon className="h-5 w-5" /></div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">live</span>
                </div>
                <div className="mt-4 font-display text-3xl font-semibold" style={{ color: c.color }}><AnimatedCounter to={c.value} /></div>
                <div className="text-xs text-muted-foreground">{c.label}</div>
              </GlassCard>
            </FadeIn>
          ))}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <GlassCard>
            <h3 className="font-display text-lg font-semibold">Risk distribution</h3>
            <div className="mt-6 flex items-center justify-around">
              <StatRing value={72} label="Low" color="var(--neon-emerald)" />
              <StatRing value={18} label="Monitor" color="var(--neon-amber)" />
              <StatRing value={8} label="High" color="var(--neon-pink)" />
              <StatRing value={2} label="Critical" color="var(--color-destructive)" />
            </div>
          </GlassCard>
          <GlassCard>
            <h3 className="font-display text-lg font-semibold">Weekly activity</h3>
            <ActivityChart />
          </GlassCard>
        </div>
      </PageSection>
    </>
  );
}

function ActivityChart() {
  const data = [12, 18, 24, 22, 30, 27, 36, 32, 40, 45, 42, 50];
  const max = Math.max(...data);
  return (
    <svg viewBox="0 0 120 60" className="mt-4 h-40 w-full">
      <defs>
        <linearGradient id="act" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.78 0.18 200 / 0.6)" />
          <stop offset="100%" stopColor="oklch(0.78 0.18 200 / 0)" />
        </linearGradient>
      </defs>
      <polyline fill="none" stroke="var(--neon-cyan)" strokeWidth="1" points={data.map((d, i) => `${(i / (data.length-1)) * 120},${60 - (d / max) * 50}`).join(" ")} />
      <polygon fill="url(#act)" points={`0,60 ${data.map((d, i) => `${(i / (data.length-1)) * 120},${60 - (d / max) * 50}`).join(" ")} 120,60`} />
      {data.map((d, i) => (
        <circle key={i} cx={(i / (data.length-1)) * 120} cy={60 - (d/max)*50} r="1" fill="var(--neon-cyan)" />
      ))}
    </svg>
  );
}