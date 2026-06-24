import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, PageSection } from "@/components/anima/page";
import { GlassCard, NeonButton, GhostButton, RiskBadge, StatRing, FadeIn } from "@/components/anima/ui";
import { Plus, Activity, Brain, MapPin, Trash2, Sparkles, ArrowRight } from "lucide-react";
import { analyze, fileToDataUrl } from "@/lib/anima-helpers";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/twin")({
  head: () => ({ meta: [{ title: "Digital Twins — ANIMA Nexus" }, { name: "description", content: "Create and monitor AI digital twins for every animal: health, behavior, risk." }] }),
  component: TwinPage,
});

type Animal = {
  id: string; name: string; species: string; breed: string | null; age_years: number | null;
  gender: string | null; color: string | null; location: string | null; image_url: string | null;
  risk_level: string; stress_score: number; activity_score: number; ai_summary: string | null;
  health_status: string; notes: string | null; created_at: string;
};

const SEED: Omit<Animal, "id" | "created_at">[] = [
  { name: "Luna", species: "Dog", breed: "Border Collie", age_years: 4, gender: "F", color: "Black & white", location: "Lisbon · Portugal", image_url: "https://images.unsplash.com/photo-1568572933382-74d440642117?w=600", risk_level: "low", stress_score: 22, activity_score: 84, ai_summary: "Luna is in great shape. Hydration and activity are excellent. Suggest a routine vet check next month.", health_status: "healthy", notes: null },
  { name: "Orion", species: "Cat", breed: "Maine Coon", age_years: 7, gender: "M", color: "Brown tabby", location: "Berlin · Germany", image_url: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600", risk_level: "moderate", stress_score: 48, activity_score: 55, ai_summary: "Orion's stress signal increased after travel. Recommend quiet routine for 48h and play sessions.", health_status: "monitor", notes: null },
];

function TwinPage() {
  const { user } = useAuth();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const load = async () => {
    if (!user) { setAnimals(SEED.map((s, i) => ({ ...s, id: "demo-" + i, created_at: new Date().toISOString() }))); setLoading(false); return; }
    const { data, error } = await supabase.from("animals").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setAnimals((data as Animal[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user]);

  const remove = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from("animals").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Twin removed"); load(); }
  };

  return (
    <>
      <PageHeader eyebrow="Module · Digital Twin" title={<>Every animal, <span className="text-gradient">always present.</span></>}
        kicker="Create a living AI profile for any animal. Health, behavior, stress, and risk update continuously.">
        <div className="mt-6 flex flex-wrap gap-3">
          <NeonButton onClick={() => setAdding(true)}><Plus className="h-4 w-4" /> New Twin</NeonButton>
          {!user && <Link to="/auth"><GhostButton>Sign in to save twins</GhostButton></Link>}
        </div>
      </PageHeader>

      <PageSection>
        {loading ? <SkeletonGrid /> : animals.length === 0 ? <EmptyState onAdd={() => setAdding(true)} /> : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {animals.map((a, i) => (
              <FadeIn key={a.id} delay={i * 0.04}>
                <TwinCard a={a} onDelete={user ? () => remove(a.id) : undefined} />
              </FadeIn>
            ))}
          </div>
        )}
      </PageSection>

      <AnimatePresence>
        {adding && <NewTwinDialog onClose={() => setAdding(false)} onSaved={() => { setAdding(false); load(); }} />}
      </AnimatePresence>
    </>
  );
}

function TwinCard({ a, onDelete }: { a: Animal; onDelete?: () => void }) {
  const risk = (["low","moderate","high","critical"].includes(a.risk_level) ? a.risk_level : "low") as "low"|"moderate"|"high"|"critical";
  return (
    <GlassCard glow="cyan" className="group relative h-full overflow-hidden p-0">
      <div className="relative h-40 overflow-hidden">
        {a.image_url ? (
          <img src={a.image_url} alt={a.name} className="h-full w-full object-cover transition group-hover:scale-105" />
        ) : (
          <div className="grid h-full place-items-center bg-gradient-to-br from-[oklch(0.25_0.06_270)] to-[oklch(0.15_0.04_265)] text-5xl">🐾</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.1_0.025_260)] via-transparent to-transparent" />
        <div className="absolute left-3 top-3"><RiskBadge level={risk} /></div>
        {onDelete && (
          <button onClick={onDelete} className="absolute right-2 top-2 rounded-md border border-white/10 bg-black/40 p-1.5 opacity-0 backdrop-blur transition group-hover:opacity-100" aria-label="Delete">
            <Trash2 className="h-3.5 w-3.5 text-[var(--neon-pink)]" />
          </button>
        )}
        <div className="absolute bottom-3 left-3">
          <div className="font-display text-xl font-semibold">{a.name}</div>
          <div className="text-xs text-muted-foreground">{a.species}{a.breed ? ` · ${a.breed}` : ""}{a.age_years ? ` · ${a.age_years}y` : ""}</div>
        </div>
      </div>
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-3 gap-2">
          <StatRing value={100 - (a.stress_score || 0)} label="Calm" color="var(--neon-emerald)" size={72} />
          <StatRing value={a.activity_score || 50} label="Activity" color="var(--neon-cyan)" size={72} />
          <StatRing value={risk === "low" ? 85 : risk === "moderate" ? 60 : risk === "high" ? 35 : 15} label="Health" color="var(--neon-violet)" size={72} />
        </div>
        {a.ai_summary && (
          <div className="rounded-md border border-[var(--neon-cyan)]/20 bg-[var(--neon-cyan)]/5 p-2.5 text-xs">
            <div className="flex items-center gap-1 text-[var(--neon-cyan)]"><Sparkles className="h-3 w-3" /> <span className="font-mono uppercase tracking-widest">AI Summary</span></div>
            <p className="mt-1 text-foreground/80">{a.ai_summary}</p>
          </div>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{a.location || "Unknown"}</span>
          <Link to="/health" className="inline-flex items-center gap-1 text-[var(--neon-cyan)] hover:underline">Run health AI <ArrowRight className="h-3 w-3" /></Link>
        </div>
      </div>
    </GlassCard>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="glass h-80 animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <GlassCard className="text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-[var(--neon-cyan)]/30 bg-[var(--neon-cyan)]/10">
        <Activity className="h-7 w-7 text-[var(--neon-cyan)]" />
      </div>
      <h3 className="mt-4 font-display text-xl font-semibold">No twins yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">Add your first animal. AI will generate the initial twin profile in seconds.</p>
      <div className="mt-5 flex justify-center"><NeonButton onClick={onAdd}><Plus className="h-4 w-4" /> Create first twin</NeonButton></div>
    </GlassCard>
  );
}

function NewTwinDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: "", species: "Dog", breed: "", age_years: "", gender: "", color: "", location: "", notes: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onPickImage = async (f: File | null) => {
    setImageFile(f);
    if (f) setImagePreview(await fileToDataUrl(f));
    else setImagePreview(null);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Please sign in to save twins"); return; }
    setBusy(true);
    try {
      let image_url: string | null = null;
      if (imageFile) {
        const path = `${user.id}/animals/${crypto.randomUUID()}-${imageFile.name}`;
        const { error: upErr } = await supabase.storage.from("anima-media").upload(path, imageFile, { upsert: false });
        if (upErr) toast.error("Image upload failed: " + upErr.message);
        else {
          const { data } = await supabase.storage.from("anima-media").createSignedUrl(path, 60 * 60 * 24 * 365);
          image_url = data?.signedUrl ?? null;
        }
      }
      toast.info("AI is generating the twin…");
      const ai = await analyze<{ ai_summary: string; risk_label: string; stress_score: number; activity_score: number; suggested_actions: string[] }>("twin_summary", {
        prompt: `Generate the initial AI twin for: name=${form.name}, species=${form.species}, breed=${form.breed}, age=${form.age_years}, gender=${form.gender}, color=${form.color}, location=${form.location}, owner notes=${form.notes || "none"}`,
      });
      if (ai.error) toast.error(ai.error);
      const insert = {
        owner_id: user.id,
        name: form.name,
        species: form.species,
        breed: form.breed || null,
        age_years: form.age_years ? Number(form.age_years) : null,
        gender: form.gender || null,
        color: form.color || null,
        location: form.location || null,
        notes: form.notes || null,
        image_url,
        ai_summary: ai.result?.ai_summary ?? null,
        risk_level: ai.result?.risk_label ?? "low",
        stress_score: typeof ai.result?.stress_score === "number" ? ai.result.stress_score : 25,
        activity_score: typeof ai.result?.activity_score === "number" ? ai.result.activity_score : 70,
      };
      const { error } = await supabase.from("animals").insert(insert);
      if (error) { toast.error(error.message); setBusy(false); return; }
      toast.success("Digital twin created");
      onSaved();
    } finally { setBusy(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur sm:items-center sm:p-6" onClick={onClose}>
      <motion.form initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}
        onSubmit={save} onClick={(e) => e.stopPropagation()}
        className="glass-strong w-full max-w-xl space-y-3 overflow-y-auto rounded-t-2xl p-6 sm:rounded-xl">
        <div className="flex items-center gap-2"><Brain className="h-5 w-5 text-[var(--neon-cyan)]" /><h3 className="font-display text-xl font-semibold">New Digital Twin</h3></div>
        <p className="text-xs text-muted-foreground">AI will analyze the details and generate the initial risk, stress, activity, and summary.</p>
        <div className="grid grid-cols-2 gap-3">
          <F label="Name" v={form.name} on={(v) => setForm({ ...form, name: v })} required />
          <F label="Species" v={form.species} on={(v) => setForm({ ...form, species: v })} required />
          <F label="Breed" v={form.breed} on={(v) => setForm({ ...form, breed: v })} />
          <F label="Age (years)" v={form.age_years} on={(v) => setForm({ ...form, age_years: v })} type="number" />
          <F label="Gender" v={form.gender} on={(v) => setForm({ ...form, gender: v })} />
          <F label="Color" v={form.color} on={(v) => setForm({ ...form, color: v })} />
          <F label="Location" v={form.location} on={(v) => setForm({ ...form, location: v })} className="col-span-2" />
        </div>
        <label className="block">
          <span className="mb-1 block text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Photo (optional)</span>
          <input type="file" accept="image/*" onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-[var(--neon-cyan)]/20 file:px-3 file:py-1 file:text-xs file:text-[var(--neon-cyan)]" />
        </label>
        {imagePreview && <img src={imagePreview} alt="" className="h-32 w-full rounded-md object-cover" />}
        <label className="block">
          <span className="mb-1 block text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Notes</span>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm" placeholder="Any temperament, habits, or context…" />
        </label>
        <div className="flex gap-2 pt-2">
          <NeonButton type="submit" disabled={busy || !form.name}>{busy ? "Creating…" : "Create twin"} <Sparkles className="h-4 w-4" /></NeonButton>
          <GhostButton type="button" onClick={onClose}>Cancel</GhostButton>
        </div>
      </motion.form>
    </motion.div>
  );
}

function F({ label, v, on, type = "text", required, className }: { label: string; v: string; on: (s: string) => void; type?: string; required?: boolean; className?: string }) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1 block text-[11px] font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
      <input type={type} value={v} onChange={(e) => on(e.target.value)} required={required}
        className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-[var(--neon-cyan)]/50" />
    </label>
  );
}