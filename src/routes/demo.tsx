import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, PageSection } from "@/components/anima/page";
import { GlassCard, NeonButton, GhostButton, RiskBadge, StatRing, FadeIn, AnimatedCounter } from "@/components/anima/ui";
import { PlayCircle, Activity, Brain, MapPin, Siren, ArrowRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/demo")({
  head: () => ({ meta: [{ title: "Live Demo — ANIMA Nexus" }, { name: "description", content: "Walk through ANIMA Nexus in 90 seconds: twin → health → lost → emergency." }] }),
  component: DemoPage,
});

const STEPS = [
  { icon: Activity, color: "var(--neon-cyan)", title: "01 · Meet Luna", body: "Luna is a 4-year-old Border Collie. Her digital twin is online and reporting healthy signals." },
  { icon: Brain, color: "var(--neon-violet)", title: "02 · Health AI flags fatigue", body: "Owner uploads a photo and notes slow eating. AI ranks risk at MODERATE, 87% confidence." },
  { icon: MapPin, color: "var(--neon-emerald)", title: "03 · Walk vanishes", body: "Luna slips her leash. The Lost Pet module activates the community network instantly." },
  { icon: Siren, color: "var(--neon-pink)", title: "04 · Sighting + reunion", body: "A nearby user reports a sighting. 88% visual match. Owner reunites with Luna in 27 minutes." },
];

function DemoPage() {
  const [step, setStep] = useState(0);
  return (
    <>
      <PageHeader eyebrow="Live Demo · Story Mode" title={<>Ninety seconds inside <span className="text-gradient">a real save.</span></>}
        kicker="Follow Luna from healthy → flagged → lost → reunited — all through the ANIMA Nexus." />
      <PageSection>
        <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
          <FadeIn>
            <GlassCard glow="cyan">
              <h3 className="flex items-center gap-2 font-display text-lg font-semibold"><PlayCircle className="h-5 w-5 text-[var(--neon-cyan)]" /> Story controls</h3>
              <div className="mt-4 space-y-2">
                {STEPS.map((s, i) => (
                  <button key={i} onClick={() => setStep(i)}
                    className={`flex w-full items-start gap-3 rounded-md border p-3 text-left transition ${step===i ? "border-[var(--neon-cyan)] bg-[var(--neon-cyan)]/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-white/10" style={{ background: `${s.color}20`, color: s.color }}><s.icon className="h-4 w-4" /></div>
                    <div>
                      <div className="text-sm font-semibold">{s.title}</div>
                      <div className="text-xs text-muted-foreground">{s.body}</div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <GhostButton onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>Prev</GhostButton>
                <NeonButton onClick={() => setStep((s) => Math.min(STEPS.length-1, s + 1))} disabled={step === STEPS.length-1}>Next <ArrowRight className="h-4 w-4" /></NeonButton>
              </div>
            </GlassCard>
          </FadeIn>

          <FadeIn delay={0.08}>
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35 }}>
                <DemoPanel step={step} />
              </motion.div>
            </AnimatePresence>
          </FadeIn>
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link to="/twin"><NeonButton><Sparkles className="h-4 w-4" /> Create your own twin</NeonButton></Link>
          <Link to="/"><GhostButton>Back home</GhostButton></Link>
        </div>
      </PageSection>
    </>
  );
}

function DemoPanel({ step }: { step: number }) {
  if (step === 0) return (
    <GlassCard>
      <div className="flex gap-4">
        <img src="https://images.unsplash.com/photo-1568572933382-74d440642117?w=400" alt="Luna" className="h-32 w-32 rounded-md object-cover" />
        <div className="flex-1">
          <div className="flex items-center gap-2"><RiskBadge level="low" /> <span className="text-xs text-muted-foreground">Twin · Live</span></div>
          <h3 className="mt-1 font-display text-2xl font-semibold">Luna</h3>
          <p className="text-sm text-muted-foreground">Border Collie · 4y · Lisbon, PT</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <StatRing value={78} label="Calm" color="var(--neon-emerald)" size={72} />
            <StatRing value={86} label="Activity" color="var(--neon-cyan)" size={72} />
            <StatRing value={91} label="Health" color="var(--neon-violet)" size={72} />
          </div>
        </div>
      </div>
      <div className="mt-4 rounded-md border border-[var(--neon-cyan)]/30 bg-[var(--neon-cyan)]/5 p-3 text-sm">
        <span className="text-[var(--neon-cyan)] font-mono uppercase tracking-widest text-[10px]">AI</span> Luna's twin is reporting normal signals. No interventions needed.
      </div>
    </GlassCard>
  );
  if (step === 1) return (
    <GlassCard>
      <div className="flex items-center gap-2"><RiskBadge level="moderate" /><span className="text-xs">Confidence <span className="font-mono text-[var(--neon-cyan)]">87%</span></span></div>
      <h3 className="mt-2 font-display text-xl font-semibold">Photo + symptoms reviewed</h3>
      <p className="mt-1 text-sm text-foreground/90">Slight lethargy and reduced appetite for 24h. Posture normal. AI suggests monitoring with hydration and rest for 24-48h. If unchanged, schedule a vet visit.</p>
      <div className="mt-3 grid gap-2">
        {["Offer fresh water and bland food","Track activity over next 24h","Reassess via Health module tomorrow"].map((s, i) => (
          <div key={i} className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm">{i+1}. {s}</div>
        ))}
      </div>
    </GlassCard>
  );
  if (step === 2) return (
    <GlassCard>
      <h3 className="font-display text-xl font-semibold">Lost Pet network activated</h3>
      <p className="mt-1 text-sm text-muted-foreground">42 nearby guardians notified. Search radius 4.2 km and expanding.</p>
      <div className="relative mt-4 h-56 overflow-hidden rounded-md border border-white/10 bg-[oklch(0.1_0.025_260)]">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: "radial-gradient(circle, var(--neon-cyan)44, transparent 70%)" }} />
        <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-[var(--neon-cyan)] shadow-[0_0_12px_currentColor]" />
        {[[30,30],[60,40],[42,68],[72,55]].map((p, i) => (
          <div key={i} className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--neon-pink)] shadow-[0_0_8px_currentColor]" style={{ left: `${p[0]}%`, top: `${p[1]}%` }} />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <div className="rounded-md border border-white/10 bg-white/5 p-2"><div className="text-[10px] uppercase text-muted-foreground">Sightings</div><div className="font-display text-xl text-[var(--neon-cyan)]"><AnimatedCounter to={4} /></div></div>
        <div className="rounded-md border border-white/10 bg-white/5 p-2"><div className="text-[10px] uppercase text-muted-foreground">Top match</div><div className="font-display text-xl text-[var(--neon-cyan)]"><AnimatedCounter to={88} suffix="%" /></div></div>
        <div className="rounded-md border border-white/10 bg-white/5 p-2"><div className="text-[10px] uppercase text-muted-foreground">Network</div><div className="font-display text-xl text-[var(--neon-cyan)]"><AnimatedCounter to={42} /></div></div>
      </div>
    </GlassCard>
  );
  return (
    <GlassCard>
      <div className="flex items-center gap-2">
        <span className="rounded-full border border-[var(--neon-emerald)]/40 bg-[var(--neon-emerald)]/10 px-2 py-0.5 text-[11px] uppercase tracking-widest text-[var(--neon-emerald)]">Reunited</span>
        <span className="text-xs text-muted-foreground">27 minutes after alert</span>
      </div>
      <h3 className="mt-2 font-display text-2xl font-semibold">Luna is home.</h3>
      <p className="mt-1 text-sm text-muted-foreground">An 88% visual match from a community sighting led the owner straight to her. Twin updated. Health monitoring resumed.</p>
      <div className="mt-4 flex gap-2">
        <Link to="/twin"><NeonButton>Create your guardian</NeonButton></Link>
      </div>
    </GlassCard>
  );
}