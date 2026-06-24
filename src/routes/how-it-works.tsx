import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PageSection } from "@/components/anima/page";
import { GlassCard, FadeIn } from "@/components/anima/ui";
import { Brain, Cpu, MapPin, Siren, Heart, Globe2, AudioLines, Activity } from "lucide-react";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({ meta: [{ title: "How It Works — ANIMA Nexus" }, { name: "description", content: "The four workflows that power ANIMA Nexus: twin, recovery, matching, response." }] }),
  component: HowPage,
});

const FLOWS = [
  { icon: Activity, color: "var(--neon-cyan)", title: "Create the twin",
    steps: ["You add an animal and a photo","AI generates risk, stress, activity, and a personalized summary","The twin updates as new events stream in"] },
  { icon: MapPin, color: "var(--neon-emerald)", title: "Lost & found",
    steps: ["Owner posts a missing report with photo","AI extracts visual features and predicts a search radius","Sightings cluster — top matches surface in seconds"] },
  { icon: Heart, color: "var(--neon-pink)", title: "Shelter matching",
    steps: ["Shelter staff log animal traits","Adopters submit a lifestyle profile","Compatibility scoring ranks the best homes with clear reasoning"] },
  { icon: Siren, color: "var(--neon-violet)", title: "Emergency response",
    steps: ["Owner taps the scenario","AI classifies urgency and emits a time-graded plan","Plan, do-nots, and next call land on screen instantly"] },
];

function HowPage() {
  return (
    <>
      <PageHeader eyebrow="How It Works" title={<>Four workflows. <span className="text-gradient">One platform.</span></>}
        kicker="From the moment an animal enters the system to the moment they are safe — everything is one decision away." />
      <PageSection>
        <div className="grid gap-6 lg:grid-cols-2">
          {FLOWS.map((f, i) => (
            <FadeIn key={f.title} delay={i*0.08}>
              <GlassCard glow="cyan" className="h-full">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-md border border-white/10" style={{ background: `${f.color}20`, color: f.color }}><f.icon className="h-5 w-5" /></div>
                  <h3 className="font-display text-xl font-semibold">{f.title}</h3>
                </div>
                <ol className="mt-4 space-y-2">
                  {f.steps.map((s, j) => (
                    <li key={j} className="flex gap-3 text-sm">
                      <span className="inline-grid h-6 w-6 shrink-0 place-items-center rounded-full border border-white/20 text-[10px] font-mono">{String(j+1).padStart(2,"0")}</span>
                      <span className="text-foreground/80">{s}</span>
                    </li>
                  ))}
                </ol>
              </GlassCard>
            </FadeIn>
          ))}
        </div>
        <FadeIn className="mt-10">
          <GlassCard>
            <div className="grid items-center gap-6 lg:grid-cols-[1fr_1.4fr]">
              <div>
                <h3 className="font-display text-2xl font-semibold">Under the hood</h3>
                <p className="mt-2 text-sm text-muted-foreground">A unified data layer connects every module. AI predictions are stored, versioned, and confidence-tagged. Risk taxonomy is shared across pets, shelter animals, livestock, and wildlife.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                {[Brain, Cpu, Globe2, AudioLines].map((Ic, i) => (
                  <div key={i} className="rounded-md border border-white/10 bg-white/5 p-3 text-center">
                    <Ic className="mx-auto h-5 w-5 text-[var(--neon-cyan)]" />
                    <div className="mt-2 font-mono uppercase tracking-widest text-muted-foreground">{["Vision","AI Gateway","Geo","Audio"][i]}</div>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </FadeIn>
      </PageSection>
    </>
  );
}