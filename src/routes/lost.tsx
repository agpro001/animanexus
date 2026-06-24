import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, PageSection } from "@/components/anima/page";
import { GlassCard, NeonButton, GhostButton, FadeIn } from "@/components/anima/ui";
import { MapPin, Search, Plus, Compass, Sparkles, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fileToDataUrl } from "@/lib/anima-helpers";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/lost")({
  head: () => ({ meta: [{ title: "Lost Pet Recovery — ANIMA Nexus" }, { name: "description", content: "AI-powered lost pet recovery: visual matching, sighting map, predictive search radius." }] }),
  component: LostPage,
});

type Report = {
  id: string; name: string; species: string; breed: string|null; color: string|null;
  last_seen_address: string|null; photo_url: string|null; status: string;
  created_at: string; contact: string|null;
};

const SEED: Report[] = [
  { id: "s1", name: "Pixel", species: "Cat", breed: "Tabby", color: "Orange", last_seen_address: "Mission District, SF", photo_url: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=600", status: "searching", created_at: new Date(Date.now()-1000*60*60*5).toISOString(), contact: null },
  { id: "s2", name: "Bear", species: "Dog", breed: "Goldendoodle", color: "Cream", last_seen_address: "Brooklyn, NY", photo_url: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600", status: "searching", created_at: new Date(Date.now()-1000*60*60*30).toISOString(), contact: null },
  { id: "s3", name: "Mochi", species: "Dog", breed: "Shiba Inu", color: "Tan", last_seen_address: "Shibuya, Tokyo", photo_url: "https://images.unsplash.com/photo-1612536057832-2ff7ead58194?w=600", status: "found", created_at: new Date(Date.now()-1000*60*60*48).toISOString(), contact: null },
];

function LostPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data, error } = await supabase.from("lost_reports").select("*").order("created_at", { ascending: false }).limit(30);
    if (error) toast.error(error.message);
    const real = (data as Report[]) ?? [];
    setReports(real.length ? real : SEED);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  return (
    <>
      <PageHeader eyebrow="Module · Lost Pet Recovery"
        title={<>Bring them <span className="text-gradient">home faster.</span></>}
        kicker="Visual matching, community sighting map, and predictive search radius. Every pair of eyes becomes a sensor.">
        <div className="mt-6 flex flex-wrap gap-3">
          <NeonButton onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Report Missing</NeonButton>
          <GhostButton><Search className="h-4 w-4" /> I saw an animal</GhostButton>
        </div>
      </PageHeader>

      <PageSection>
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <FadeIn>
            <GlassCard>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-display text-lg font-semibold"><Compass className="h-5 w-5 text-[var(--neon-emerald)]" /> Live search field</h3>
                <span className="text-xs text-muted-foreground">{reports.length} active reports</span>
              </div>
              <SearchMap reports={reports} />
            </GlassCard>
          </FadeIn>
          <FadeIn delay={0.08}>
            <GlassCard className="h-full">
              <h3 className="flex items-center gap-2 font-display text-lg font-semibold"><Sparkles className="h-5 w-5 text-[var(--neon-violet)]" /> Recent reports</h3>
              <div className="mt-3 space-y-3">
                {loading ? [...Array(3)].map((_, i) => <div key={i} className="h-20 animate-pulse rounded-md bg-white/5" />)
                  : reports.slice(0, 6).map((r) => <ReportRow key={r.id} r={r} />)}
              </div>
            </GlassCard>
          </FadeIn>
        </div>
      </PageSection>

      <AnimatePresence>
        {open && <ReportDialog onClose={() => setOpen(false)} onSaved={() => { setOpen(false); load(); }} userId={user?.id ?? null} />}
      </AnimatePresence>
    </>
  );
}

function SearchMap({ reports }: { reports: Report[] }) {
  // Pseudo-map: stylized grid + plotted points
  const pts = reports.slice(0, 12).map((_, i) => ({
    x: 8 + ((i * 73) % 84),
    y: 14 + ((i * 41) % 72),
    label: reports[i].name,
    found: reports[i].status === "found",
  }));
  return (
    <div className="relative h-[420px] overflow-hidden rounded-md border border-white/10 bg-[oklch(0.1_0.025_260)]">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        {[20,40,60,80].map((c) => <circle key={c} cx="50" cy="50" r={c/2} fill="none" stroke="oklch(0.78 0.18 200 / 0.15)" strokeDasharray="0.5,1" />)}
        <line x1="0" y1="50" x2="100" y2="50" stroke="oklch(0.5 0.04 270 / 0.3)" strokeWidth="0.2" />
        <line x1="50" y1="0" x2="50" y2="100" stroke="oklch(0.5 0.04 270 / 0.3)" strokeWidth="0.2" />
      </svg>
      {pts.map((p, i) => (
        <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
          <div className={`relative h-3 w-3 rounded-full ${p.found ? "bg-[var(--neon-emerald)]" : "bg-[var(--neon-pink)]"}`} style={{ boxShadow: `0 0 12px currentColor` }}>
            <span className={`absolute inset-0 animate-ping rounded-full ${p.found ? "bg-[var(--neon-emerald)]" : "bg-[var(--neon-pink)]"} opacity-70`} />
          </div>
          <div className="mt-1 whitespace-nowrap rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-foreground/80 backdrop-blur">{p.label}</div>
        </div>
      ))}
      <div className="absolute bottom-3 left-3 rounded-md border border-white/10 bg-black/40 px-3 py-2 text-[10px] font-mono uppercase tracking-widest backdrop-blur">
        <div className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[var(--neon-pink)] shadow-[0_0_6px_currentColor]" /> Searching</div>
        <div className="mt-1 flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[var(--neon-emerald)] shadow-[0_0_6px_currentColor]" /> Reunited</div>
      </div>
      <div className="absolute right-3 top-3 rounded-md border border-[var(--neon-cyan)]/40 bg-[var(--neon-cyan)]/10 px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-[var(--neon-cyan)]">Predictive radius · 4.2 km</div>
    </div>
  );
}

function ReportRow({ r }: { r: Report }) {
  const ago = Math.round((Date.now() - new Date(r.created_at).getTime()) / 3.6e6);
  return (
    <div className="flex items-center gap-3 rounded-md border border-white/10 bg-white/5 p-2">
      <div className="h-14 w-14 overflow-hidden rounded-md bg-white/10">
        {r.photo_url ? <img src={r.photo_url} alt={r.name} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-xl">🐾</div>}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="font-display text-sm font-semibold">{r.name}</div>
          {r.status === "found" ? (
            <span className="rounded-full border border-[var(--neon-emerald)]/40 bg-[var(--neon-emerald)]/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-[var(--neon-emerald)]">Reunited</span>
          ) : (
            <span className="rounded-full border border-[var(--neon-pink)]/40 bg-[var(--neon-pink)]/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-[var(--neon-pink)]">Searching</span>
          )}
        </div>
        <div className="truncate text-xs text-muted-foreground">{r.species}{r.breed ? ` · ${r.breed}` : ""}{r.color ? ` · ${r.color}` : ""}</div>
        <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground"><MapPin className="h-3 w-3" />{r.last_seen_address || "—"} · {ago}h ago</div>
      </div>
    </div>
  );
}

function ReportDialog({ onClose, onSaved, userId }: { onClose: () => void; onSaved: () => void; userId: string | null }) {
  const [form, setForm] = useState({ name: "", species: "Dog", breed: "", color: "", size: "", collar: "", last_seen_address: "", contact: "" });
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgPrev, setImgPrev] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pick = async (f: File | null) => { setImgFile(f); setImgPrev(f ? await fileToDataUrl(f) : null); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) { toast.error("Please sign in first"); return; }
    setBusy(true);
    try {
      let photo_url: string | null = null;
      if (imgFile) {
        const path = `${userId}/lost/${crypto.randomUUID()}-${imgFile.name}`;
        const { error } = await supabase.storage.from("anima-media").upload(path, imgFile);
        if (error) toast.error(error.message);
        else {
          const { data } = await supabase.storage.from("anima-media").createSignedUrl(path, 60 * 60 * 24 * 365);
          photo_url = data?.signedUrl ?? null;
        }
      }
      const { error } = await supabase.from("lost_reports").insert({
        owner_id: userId, ...form, photo_url, last_seen_at: new Date().toISOString(),
      });
      if (error) { toast.error(error.message); return; }
      toast.success("Report posted — community alerted");
      onSaved();
    } finally { setBusy(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose} className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur sm:items-center sm:p-6">
      <motion.form initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}
        onClick={(e) => e.stopPropagation()} onSubmit={save}
        className="glass-strong w-full max-w-xl space-y-3 overflow-y-auto rounded-t-2xl p-6 sm:rounded-xl">
        <div className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-[var(--neon-pink)]" /><h3 className="font-display text-xl font-semibold">Report missing animal</h3></div>
        <div className="grid grid-cols-2 gap-3">
          <SimpleField label="Name" v={form.name} on={(v) => setForm({ ...form, name: v })} required />
          <SimpleField label="Species" v={form.species} on={(v) => setForm({ ...form, species: v })} required />
          <SimpleField label="Breed" v={form.breed} on={(v) => setForm({ ...form, breed: v })} />
          <SimpleField label="Color" v={form.color} on={(v) => setForm({ ...form, color: v })} />
          <SimpleField label="Size" v={form.size} on={(v) => setForm({ ...form, size: v })} />
          <SimpleField label="Collar / tags" v={form.collar} on={(v) => setForm({ ...form, collar: v })} />
          <SimpleField label="Last seen location" v={form.last_seen_address} on={(v) => setForm({ ...form, last_seen_address: v })} className="col-span-2" />
          <SimpleField label="Contact info" v={form.contact} on={(v) => setForm({ ...form, contact: v })} className="col-span-2" />
        </div>
        <label className="block">
          <span className="mb-1 block text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Photo</span>
          <input type="file" accept="image/*" onChange={(e) => pick(e.target.files?.[0] ?? null)} className="w-full rounded-md border border-white/10 bg-white/5 p-2 text-sm" />
        </label>
        {imgPrev && <img src={imgPrev} alt="" className="h-32 w-full rounded-md object-cover" />}
        <div className="flex gap-2 pt-2">
          <NeonButton type="submit" disabled={busy || !form.name}>{busy ? "Posting…" : "Alert the network"}</NeonButton>
          <GhostButton type="button" onClick={onClose}>Cancel</GhostButton>
        </div>
      </motion.form>
    </motion.div>
  );
}

function SimpleField({ label, v, on, required, className }: { label: string; v: string; on: (s: string) => void; required?: boolean; className?: string }) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1 block text-[11px] font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
      <input value={v} onChange={(e) => on(e.target.value)} required={required}
        className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-[var(--neon-cyan)]/50" />
    </label>
  );
}