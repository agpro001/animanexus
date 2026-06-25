import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, PlayCircle, Activity, Brain, MapPin, Heart, Globe2, AudioLines, Siren, BarChart3, Shield, Cpu, Radio, Sparkles, Workflow, PlaySquare, HelpCircle, Info, Mail } from "lucide-react";
import { NexusGlobe } from "@/components/anima/globe";
import { AnimatedCounter, FadeIn, GhostButton, GlassCard, NeonButton, RiskBadge, SectionHeading, StatRing } from "@/components/anima/ui";
import { useState } from "react";
import { motion } from "framer-motion";
import { FeatureCube } from "@/components/anima/feature-cube";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ANIMA Nexus — The AI Digital Guardian for Every Animal" },
      { name: "description", content: "Cinematic AI platform that gives every animal a digital twin: predict health, find lost pets, match shelter adopters, monitor wildlife, and respond to emergencies." },
    ],
  }),
  component: Index,
});

const MODULES = [
  { to: "/twin", icon: Activity, color: "var(--neon-cyan)", title: "Digital Twin", text: "A living, AI-updated profile for every animal: health, behavior, stress, location, risk." },
  { to: "/health", icon: Brain, color: "var(--neon-violet)", title: "Health Intelligence", text: "Photo, symptom, and behavior analysis with confidence-scored risk and next-step plans." },
  { to: "/lost", icon: MapPin, color: "var(--neon-emerald)", title: "Lost Pet Recovery", text: "Visual matching, sighting map, and predictive search radius — your community as a sensor." },
  { to: "/shelter", icon: Heart, color: "var(--neon-pink)", title: "Shelter & Adoption", text: "Compatibility ranking matches animals to the home they'll actually thrive in." },
  { to: "/wildlife", icon: Globe2, color: "var(--neon-amber)", title: "Wildlife Guardian", text: "Habitat threat scoring, climate risk, poaching alerts, and conservation command-center maps." },
  { to: "/audio", icon: AudioLines, color: "var(--neon-cyan)", title: "Audio Insight", text: "Bark, meow, and bird-call interpretation with emotional state estimates." },
  { to: "/emergency", icon: Siren, color: "var(--neon-pink)", title: "Emergency Response", text: "One-tap distress flow that classifies urgency and gives a time-critical action plan." },
  { to: "/analytics", icon: BarChart3, color: "var(--neon-violet)", title: "Impact Analytics", text: "Track animals protected, matches found, risks intercepted — across your entire ecosystem." },
] as const;

const PREVIEW = {
  overview: {
    title: "Live system overview",
    metrics: [["Animals protected", 12847, "+12%"], ["Alerts intercepted", 304, "live"], ["Match accuracy", 96.4, "%"]] as [string, number, string][],
    note: "Every digital twin reports in real time. Risk models recompute every 30s.",
  },
  health: {
    title: "Health intelligence",
    metrics: [["Risk score", 22, "low"], ["Confidence", 91, "%"], ["Hydration", 78, "%"]] as [string, number, string][],
    note: "Photo + symptom analysis suggests routine monitoring. No urgent intervention needed.",
  },
  rescue: {
    title: "Lost pet recovery",
    metrics: [["Search radius", 4.2, "km"], ["Sightings", 11, "today"], ["Top match", 88, "%"]] as [string, number, string][],
    note: "Three high-confidence sightings cluster northeast — recommend expanding alerts.",
  },
  wildlife: {
    title: "Wildlife guardian",
    metrics: [["Active threats", 7, "live"], ["High-risk zones", 3, ""], ["Habitat health", 71, "%"]] as [string, number, string][],
    note: "Drought signal rising in Sector 4. Ranger team dispatched.",
  },
} as const;

function Index() {
  return (
    <div className="relative overflow-x-hidden">
      <Hero />
      <FeatureCubes />
      <Modules />
      <LivePreview />
      <HowSection />
      <ImpactBand />
      <CTA />
    </div>
  );
}

const CUBES = [
  { to: "/how-it-works", label: "How It Works", icon: Workflow, color: "oklch(0.85 0.18 200)" },
  { to: "/twin", label: "Digital Twin", icon: Activity, color: "oklch(0.85 0.18 200)" },
  { to: "/health", label: "Health AI", icon: Brain, color: "oklch(0.75 0.24 300)" },
  { to: "/lost", label: "Lost Pets", icon: MapPin, color: "oklch(0.8 0.2 165)" },
  { to: "/shelter", label: "Shelter", icon: Heart, color: "oklch(0.75 0.24 0)" },
  { to: "/wildlife", label: "Wildlife", icon: Globe2, color: "oklch(0.84 0.18 80)" },
  { to: "/audio", label: "Audio", icon: AudioLines, color: "oklch(0.85 0.18 200)" },
  { to: "/emergency", label: "Emergency", icon: Siren, color: "oklch(0.7 0.24 20)" },
  { to: "/analytics", label: "Analytics", icon: BarChart3, color: "oklch(0.75 0.24 300)" },
  { to: "/demo", label: "Demo Mode", icon: PlaySquare, color: "oklch(0.8 0.2 165)" },
  { to: "/faq", label: "FAQ", icon: HelpCircle, color: "oklch(0.84 0.18 80)" },
  { to: "/about", label: "About", icon: Info, color: "oklch(0.85 0.18 200)" },
  { to: "/contact", label: "Contact", icon: Mail, color: "oklch(0.75 0.24 300)" },
] as const;

function FeatureCubes() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-10 pt-6">
      <SectionHeading
        eyebrow="Jump in"
        title={<>Explore the <span className="text-gradient">Nexus</span></>}
        kicker="Tap any cube to enter that module. Each one is live and fully working."
      />
      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
        {CUBES.map((c, i) => (
          <FeatureCube key={c.to} {...c} delay={i * 0.04} />
        ))}
      </div>
    </section>
  );
}

function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-30" aria-hidden />
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 pb-20 pt-14 lg:grid-cols-[1.05fr_1fr] lg:pb-32 lg:pt-20">
        <div className="relative z-10">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--neon-cyan)]/30 bg-[var(--neon-cyan)]/5 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-[var(--neon-cyan)]">
            <Sparkles className="h-3 w-3" /> A digital guardian for every animal
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.05 }}
            className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            <span className="text-gradient">ANIMA Nexus</span>
            <br />
            <span className="text-foreground/90">The AI Digital Guardian</span>
            <br />
            <span className="text-foreground/70">for Every Animal.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            One intelligent ecosystem to protect pets, shelter animals, livestock, and wildlife. Real-time twins, predictive health, lost-pet recovery, conservation maps, and instant emergency response — all powered by Lovable AI.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/twin"><NeonButton>Explore the Platform <ArrowRight className="h-4 w-4" /></NeonButton></Link>
            <Link to="/demo"><GhostButton><PlayCircle className="h-4 w-4" /> View Live Demo</GhostButton></Link>
            <Link to="/how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground">See how it works →</Link>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-10 grid max-w-lg grid-cols-3 gap-4 text-left">
            {[
              ["12,847", "Twins live"],
              ["96.4%", "Match accuracy"],
              ["<1.2s", "Alert latency"],
            ].map(([n, l]) => (
              <div key={l} className="glass px-3 py-3">
                <div className="font-display text-xl font-semibold text-[var(--neon-cyan)]">{n}</div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{l}</div>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, delay: 0.2 }}
          className="relative mx-auto w-full max-w-[520px]">
          <NexusGlobe size={520} />
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Earth · 64 ecosystems · 12,847 active twins
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Modules() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-16">
      <SectionHeading eyebrow="The Platform" title={<>One ecosystem. <span className="text-gradient">Every animal.</span></>}
        kicker="Eight intelligent modules working together to protect lives — from a single pet to an entire habitat." />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MODULES.map((m, i) => (
          <FadeIn key={m.to} delay={i * 0.06}>
            <Link to={m.to as never}>
              <GlassCard glow="cyan" className="group h-full">
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10" style={{ background: `${m.color}20`, color: m.color }}>
                  <m.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{m.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{m.text}</p>
                <div className="mt-4 inline-flex items-center gap-1 text-xs text-[var(--neon-cyan)] opacity-0 transition group-hover:opacity-100">
                  Open module <ArrowRight className="h-3 w-3" />
                </div>
              </GlassCard>
            </Link>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

function LivePreview() {
  const [tab, setTab] = useState<keyof typeof PREVIEW>("overview");
  const data = PREVIEW[tab];
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <SectionHeading eyebrow="Mission control" title={<>A real-time look <span className="text-gradient">inside the nexus</span></>} />
      <FadeIn className="mt-10">
        <div className="glass-strong p-3">
          <div className="flex flex-wrap gap-1 border-b border-white/10 pb-2">
            {(Object.keys(PREVIEW) as (keyof typeof PREVIEW)[]).map((k) => (
              <button key={k} onClick={() => setTab(k)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition ${
                  tab === k ? "bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)]" : "text-muted-foreground hover:text-foreground"
                }`}>{k}</button>
            ))}
          </div>
          <div className="grid gap-6 p-5 lg:grid-cols-[1.2fr_1fr]">
            <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-[var(--neon-cyan)]" />
                <h3 className="font-display text-xl font-semibold">{data.title}</h3>
                <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-[var(--neon-emerald)]/40 bg-[var(--neon-emerald)]/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-[var(--neon-emerald)]">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--neon-emerald)]" /> Live
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {data.metrics.map(([label, value, suffix]) => (
                  <div key={label} className="rounded-md border border-white/10 bg-white/5 p-3">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="font-display text-2xl font-semibold text-[var(--neon-cyan)]"><AnimatedCounter to={value} /></span>
                      <span className="text-xs text-muted-foreground">{suffix}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-md border border-[var(--neon-cyan)]/30 bg-[var(--neon-cyan)]/5 p-3 text-sm">
                <div className="flex items-center gap-1.5 text-[var(--neon-cyan)]"><Radio className="h-3.5 w-3.5" /> <span className="text-[11px] font-mono uppercase tracking-widest">AI Note</span></div>
                <div className="mt-1 text-foreground/90">{data.note}</div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Spark label="Risk" />
                <Spark label="Activity" up />
                <Spark label="Stress" down />
              </div>
            </motion.div>
            <motion.div key={tab + "rings"} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
              className="flex items-center justify-around rounded-md border border-white/10 bg-[oklch(0.1_0.025_260/0.6)] p-5">
              <StatRing value={Number(data.metrics[0][1]) > 100 ? 80 : Number(data.metrics[0][1])} label={String(data.metrics[0][0])} color="var(--neon-cyan)" />
              <StatRing value={Number(data.metrics[1][1]) > 100 ? 70 : Number(data.metrics[1][1])} label={String(data.metrics[1][0])} color="var(--neon-violet)" />
              <StatRing value={Number(data.metrics[2][1]) > 100 ? 65 : Number(data.metrics[2][1])} label={String(data.metrics[2][0])} color="var(--neon-emerald)" />
            </motion.div>
          </div>
        </div>
      </FadeIn>
    </section>
  );
}

function Spark({ label, up, down }: { label: string; up?: boolean; down?: boolean }) {
  const points = up ? "0,18 12,14 24,16 36,8 48,10 60,4"
    : down ? "0,4 12,8 24,6 36,12 48,10 60,16"
    : "0,10 12,12 24,8 36,14 48,9 60,11";
  const color = up ? "var(--neon-emerald)" : down ? "var(--neon-pink)" : "var(--neon-cyan)";
  return (
    <div className="rounded-md border border-white/10 bg-white/5 p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <svg viewBox="0 0 60 20" className="mt-2 h-8 w-full" preserveAspectRatio="none">
        <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
      </svg>
    </div>
  );
}

function HowSection() {
  const steps = [
    { n: "01", t: "Create a digital twin", d: "Add an animal, a photo, and a few traits. AI builds a living profile in seconds." },
    { n: "02", t: "Continuous intelligence", d: "Health, behavior, location, and stress signals update the twin in real time." },
    { n: "03", t: "Predict & match", d: "Risk scores, lost-pet visual matches, and adopter compatibility ranked by confidence." },
    { n: "04", t: "Act in time", d: "One-tap emergency flow, ranger alerts, vet referrals, and step-by-step action plans." },
  ];
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <SectionHeading eyebrow="How it works" title={<>From silence to <span className="text-gradient">situational awareness.</span></>} />
      <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <FadeIn key={s.n} delay={i * 0.08}>
            <GlassCard className="relative h-full overflow-hidden">
              <div className="absolute right-3 top-3 font-mono text-[10px] text-[var(--neon-cyan)]">{s.n}</div>
              <Shield className="h-6 w-6 text-[var(--neon-violet)]" />
              <h3 className="mt-4 font-display text-lg font-semibold">{s.t}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.d}</p>
            </GlassCard>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

function ImpactBand() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <FadeIn>
        <div className="glass-strong overflow-hidden p-8 sm:p-12">
          <div className="grid gap-6 lg:grid-cols-4">
            {[
              ["Animals protected", 12847, ""],
              ["AI predictions", 482300, ""],
              ["Lost pets reunited", 1029, ""],
              ["Habitats monitored", 64, ""],
            ].map(([l, v]) => (
              <div key={l as string}>
                <div className="font-display text-3xl font-semibold text-[var(--neon-cyan)] sm:text-4xl">
                  <AnimatedCounter to={v as number} />
                </div>
                <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{l}</div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <RiskBadge level="low" /><RiskBadge level="moderate" /><RiskBadge level="high" /><RiskBadge level="critical" />
            </div>
            <span className="text-xs text-muted-foreground">Risk taxonomy unified across modules.</span>
          </div>
        </div>
      </FadeIn>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-24 text-center">
      <FadeIn>
        <h2 className="font-display text-3xl font-semibold sm:text-5xl">
          Give every animal a <span className="text-gradient">guardian.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Create your first digital twin in 60 seconds — and let ANIMA Nexus watch, predict, and protect from day one.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/auth"><NeonButton>Get started free <ArrowRight className="h-4 w-4" /></NeonButton></Link>
          <Link to="/demo"><GhostButton><PlayCircle className="h-4 w-4" /> Try the demo</GhostButton></Link>
        </div>
      </FadeIn>
    </section>
  );
}
