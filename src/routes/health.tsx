import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, PageSection } from "@/components/anima/page";
import { GlassCard, NeonButton, RiskBadge, FadeIn, StatRing } from "@/components/anima/ui";
import { Brain, Upload, Sparkles, AlertTriangle, CheckCircle2, ListChecks } from "lucide-react";
import { analyze, fileToDataUrl } from "@/lib/anima-helpers";
import { toast } from "sonner";

export const Route = createFileRoute("/health")({
  head: () => ({ meta: [{ title: "Health Intelligence — ANIMA Nexus" }, { name: "description", content: "Upload a photo and symptoms — AI returns a risk-scored health analysis." }] }),
  component: HealthPage,
});

type Res = { risk_label: "low"|"moderate"|"high"|"critical"; confidence: number; summary: string; observations: string[]; next_steps: string[] };

function HealthPage() {
  const [image, setImage] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Res | null>(null);

  const onPick = async (f: File | null) => { setImage(f ? await fileToDataUrl(f) : null); };

  const run = async () => {
    if (!image && !symptoms.trim()) { toast.error("Add a photo or describe symptoms first"); return; }
    setBusy(true); setRes(null);
    const r = await analyze<Res>("health_photo", {
      prompt: symptoms.trim() || "Assess this animal from the photo.",
      imageDataUrl: image ?? undefined,
    });
    setBusy(false);
    if (r.error) { toast.error(r.error); return; }
    if (r.result) { setRes(r.result); toast.success("Analysis complete"); }
  };

  return (
    <>
      <PageHeader eyebrow="Module · Health Intelligence" title={<>Spot trouble <span className="text-gradient">before it spreads.</span></>}
        kicker="Photo + symptom triage with confidence-scored risk, observations, and a clear next-step plan." />
      <PageSection>
        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <FadeIn>
            <GlassCard glow="cyan">
              <h3 className="flex items-center gap-2 font-display text-lg font-semibold"><Brain className="h-5 w-5 text-[var(--neon-cyan)]" /> Submit a case</h3>
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Photo</span>
                  <div className="relative grid place-items-center rounded-md border border-dashed border-white/15 bg-white/5 p-6 text-center">
                    {image ? <img src={image} alt="" className="max-h-48 rounded-md object-contain" /> : (
                      <div className="text-sm text-muted-foreground">
                        <Upload className="mx-auto mb-2 h-6 w-6" />
                        Drop image or click to upload
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={(e) => onPick(e.target.files?.[0] ?? null)} className="absolute inset-0 cursor-pointer opacity-0" />
                  </div>
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Symptoms / context</span>
                  <textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)} rows={5} placeholder="e.g. Dog has been lethargic for 2 days, not eating, slight limp on left front leg."
                    className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-[var(--neon-cyan)]/50" />
                </label>
                <NeonButton onClick={run} disabled={busy}>{busy ? "Analyzing…" : "Run health AI"} <Sparkles className="h-4 w-4" /></NeonButton>
                <p className="text-xs text-muted-foreground">AI-generated insight — never a replacement for a veterinarian. For emergencies use the Emergency module.</p>
              </div>
            </GlassCard>
          </FadeIn>

          <FadeIn delay={0.1}>
            <GlassCard className="h-full">
              <h3 className="flex items-center gap-2 font-display text-lg font-semibold"><Sparkles className="h-5 w-5 text-[var(--neon-violet)]" /> AI assessment</h3>
              {!res && !busy && (
                <div className="grid h-64 place-items-center text-center text-sm text-muted-foreground">
                  Submit a case to see a risk-scored assessment here.
                </div>
              )}
              {busy && (
                <div className="grid h-64 place-items-center text-center">
                  <div>
                    <div className="mx-auto h-12 w-12 animate-spin-slow rounded-full border-2 border-[var(--neon-cyan)]/30 border-t-[var(--neon-cyan)]" />
                    <div className="mt-3 text-sm text-muted-foreground">Reviewing photo and symptoms…</div>
                  </div>
                </div>
              )}
              {res && (
                <div className="mt-4 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <RiskBadge level={res.risk_label} />
                    <div className="text-xs text-muted-foreground">Confidence <span className="font-mono text-[var(--neon-cyan)]">{res.confidence}%</span></div>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatRing value={res.confidence} label="Confidence" color="var(--neon-cyan)" />
                    <div className="flex-1 text-sm text-foreground/90">{res.summary}</div>
                  </div>
                  <Detail icon={CheckCircle2} title="Observations" items={res.observations} color="var(--neon-emerald)" />
                  <Detail icon={ListChecks} title="Next steps" items={res.next_steps} color="var(--neon-cyan)" />
                  {(res.risk_label === "high" || res.risk_label === "critical") && (
                    <div className="rounded-md border border-[var(--neon-pink)]/40 bg-[var(--neon-pink)]/10 p-3 text-sm">
                      <div className="flex items-center gap-1 text-[var(--neon-pink)]"><AlertTriangle className="h-4 w-4" /><span className="font-mono uppercase tracking-widest text-[10px]">Action recommended</span></div>
                      <p className="mt-1 text-foreground/90">Contact your veterinarian as soon as possible. For life-threatening signs go to the nearest animal emergency hospital.</p>
                    </div>
                  )}
                </div>
              )}
            </GlassCard>
          </FadeIn>
        </div>
      </PageSection>
    </>
  );
}

function Detail({ icon: Icon, title, items, color }: { icon: typeof Brain; title: string; items: string[]; color: string }) {
  if (!items?.length) return null;
  return (
    <div className="rounded-md border border-white/10 bg-white/5 p-3">
      <div className="flex items-center gap-1.5 text-xs" style={{ color }}><Icon className="h-3.5 w-3.5" /><span className="font-mono uppercase tracking-widest">{title}</span></div>
      <ul className="mt-2 space-y-1.5 text-sm">
        {items.map((it, i) => <li key={i} className="flex gap-2"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full" style={{ background: color }} />{it}</li>)}
      </ul>
    </div>
  );
}