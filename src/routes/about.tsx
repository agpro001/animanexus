import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, PageSection } from "@/components/anima/page";
import { GlassCard, FadeIn, NeonButton } from "@/components/anima/ui";
import { Sparkles, ShieldCheck, Heart } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About — ANIMA Nexus" }, { name: "description", content: "ANIMA Nexus is a research-grade AI animal protection platform giving every animal a digital guardian." }] }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <>
      <PageHeader eyebrow="About" title={<>A digital guardian <span className="text-gradient">for every animal.</span></>}
        kicker="ANIMA Nexus turns scattered animal data into a unified, intelligent ecosystem. Built on Lovable AI." />
      <PageSection>
        <div className="grid gap-6 lg:grid-cols-3">
          {[
            { i: Sparkles, t: "Mission", b: "Use AI to predict, prevent, and respond — so fewer animals fall through the cracks." },
            { i: ShieldCheck, t: "Approach", b: "Confidence-scored predictions, transparent reasoning, and human-in-the-loop control for every critical decision." },
            { i: Heart, t: "Promise", b: "We will never replace the vet, the ranger, or the rescuer. We make them stronger." },
          ].map((c, i) => (
            <FadeIn key={c.t} delay={i*0.06}>
              <GlassCard className="h-full">
                <c.i className="h-6 w-6 text-[var(--neon-cyan)]" />
                <h3 className="mt-3 font-display text-lg font-semibold">{c.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{c.b}</p>
              </GlassCard>
            </FadeIn>
          ))}
        </div>
        <FadeIn className="mt-10">
          <GlassCard className="text-center">
            <h2 className="font-display text-2xl font-semibold">Built for hackathons, ready for the world.</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
              Every module is real: real AI calls, real database, real auth, real persistence. ANIMA Nexus is a working prototype of a platform we believe should exist.
            </p>
            <div className="mt-5"><Link to="/twin"><NeonButton>Try it now</NeonButton></Link></div>
          </GlassCard>
        </FadeIn>
      </PageSection>
    </>
  );
}