import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { PageHeader, PageSection } from "@/components/anima/page";
import { GlassCard, NeonButton, GhostButton, FadeIn } from "@/components/anima/ui";
import { AudioLines, Upload, Sparkles, Mic, Square } from "lucide-react";
import { analyze, audioFormatFromMime, fileToBase64 } from "@/lib/anima-helpers";
import { toast } from "sonner";

export const Route = createFileRoute("/audio")({
  head: () => ({ meta: [{ title: "Audio Insight — ANIMA Nexus" }, { name: "description", content: "AI interpretation of barks, meows, and bird calls — with emotional state estimates." }] }),
  component: AudioPage,
});

type Res = { species_guess: string; likely_emotion: string; confidence: number; waveform_notes: string; interpretation: string; caution: string };

function AudioPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Res | null>(null);
  const [recording, setRecording] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const onFile = (f: File | null) => {
    setFile(f);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
  };

  const toggleRecord = async () => {
    if (recording) { mediaRef.current?.stop(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRef.current = mr; chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType });
        const f = new File([blob], `recording.${audioFormatFromMime(mr.mimeType)}`, { type: mr.mimeType });
        onFile(f);
        setRecording(false);
      };
      mr.start(); setRecording(true);
    } catch { toast.error("Microphone access denied"); }
  };

  const run = async () => {
    if (!file) { toast.error("Add an audio clip first"); return; }
    setBusy(true); setRes(null);
    const data = await fileToBase64(file);
    const format = audioFormatFromMime(file.type);
    const r = await analyze<Res>("audio", {
      prompt: "Interpret this animal vocalization.",
      audio: { dataBase64: data, format },
    });
    setBusy(false);
    if (r.error) { toast.error(r.error); return; }
    if (r.result) setRes(r.result);
  };

  return (
    <>
      <PageHeader eyebrow="Module · Audio Insight"
        title={<>Listen to <span className="text-gradient">what they're saying.</span></>}
        kicker="Upload or record a clip. AI infers species, mood, and likely state — with honest confidence labeling." />
      <PageSection>
        <div className="grid gap-6 lg:grid-cols-2">
          <FadeIn>
            <GlassCard glow="cyan">
              <h3 className="flex items-center gap-2 font-display text-lg font-semibold"><AudioLines className="h-5 w-5 text-[var(--neon-cyan)]" /> Sample input</h3>
              <div className="mt-4 grid place-items-center rounded-md border border-dashed border-white/15 bg-white/5 p-6 text-center">
                {file ? (
                  <div className="w-full">
                    <div className="font-mono text-xs text-muted-foreground">{file.name}</div>
                    {previewUrl && <audio src={previewUrl} controls className="mt-3 w-full" />}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground"><Upload className="mx-auto mb-2 h-6 w-6" /> Drop audio (webm, mp3, wav, m4a)</div>
                )}
                <input type="file" accept="audio/*" onChange={(e) => onFile(e.target.files?.[0] ?? null)} className="mt-3 w-full text-xs text-muted-foreground" />
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={toggleRecord} className={`flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm ${recording ? "border-[var(--neon-pink)] bg-[var(--neon-pink)]/15 text-[var(--neon-pink)]" : "border-white/10 bg-white/5"}`}>
                  {recording ? <><Square className="h-3.5 w-3.5" /> Stop recording</> : <><Mic className="h-3.5 w-3.5" /> Record from mic</>}
                </button>
                <GhostButton onClick={() => { setFile(null); setRes(null); }}>Clear</GhostButton>
              </div>
              <NeonButton onClick={run} disabled={busy || !file} className="mt-3 w-full">{busy ? "Listening…" : "Interpret"} <Sparkles className="h-4 w-4" /></NeonButton>
            </GlassCard>
          </FadeIn>

          <FadeIn delay={0.08}>
            <GlassCard className="h-full">
              <h3 className="flex items-center gap-2 font-display text-lg font-semibold"><Sparkles className="h-5 w-5 text-[var(--neon-violet)]" /> Interpretation</h3>
              {!res && !busy && <div className="mt-6 text-sm text-muted-foreground">Submit a clip to see the AI interpretation.</div>}
              {busy && <Waveform />}
              {res && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <EmotionRing emotion={res.likely_emotion} confidence={res.confidence} />
                    <div className="flex-1">
                      <div className="font-display text-2xl font-semibold">{res.likely_emotion}</div>
                      <div className="text-xs text-muted-foreground">{res.species_guess} · confidence <span className="font-mono text-[var(--neon-cyan)]">{res.confidence}%</span></div>
                    </div>
                  </div>
                  <div className="rounded-md border border-white/10 bg-white/5 p-3 text-sm">{res.interpretation}</div>
                  <div className="rounded-md border border-white/10 bg-white/5 p-3 text-xs text-muted-foreground">{res.waveform_notes}</div>
                  <div className="rounded-md border border-[var(--neon-amber)]/40 bg-[var(--neon-amber)]/10 p-3 text-xs text-[var(--neon-amber)]">{res.caution}</div>
                </div>
              )}
            </GlassCard>
          </FadeIn>
        </div>
      </PageSection>
    </>
  );
}

function Waveform() {
  return (
    <div className="mt-6 flex h-32 items-center justify-center gap-1">
      {Array.from({ length: 48 }).map((_, i) => (
        <span key={i} className="w-1 rounded-full bg-[var(--neon-cyan)] animate-pulse-glow" style={{ height: `${30 + Math.sin(i) * 20 + Math.random() * 40}%`, animationDelay: `${i * 40}ms` }} />
      ))}
    </div>
  );
}

function EmotionRing({ emotion, confidence }: { emotion: string; confidence: number }) {
  const color = /distress|aggress|alarm/i.test(emotion) ? "var(--neon-pink)" : /calm|content|happy|playful/i.test(emotion) ? "var(--neon-emerald)" : "var(--neon-cyan)";
  const r = 36, c = 2 * Math.PI * r;
  return (
    <svg width="96" height="96" className="-rotate-90">
      <circle cx="48" cy="48" r={r} fill="none" stroke="oklch(0.3 0.04 270 / 0.5)" strokeWidth="6" />
      <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - confidence/100)} style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
    </svg>
  );
}