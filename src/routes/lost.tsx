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
  created_at: string;
};

const SEED: Report[] = [
  { id: "s1", name: "Pixel", species: "Cat", breed: "Tabby", color: "Orange", last_seen_address: "Mission District, SF", photo_url: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=600", status: "searching", created_at: new Date(Date.now()-1000*60*60*5).toISOString() },
  { id: "s2", name: "Bear", species: "Dog", breed: "Goldendoodle", color: "Cream", last_seen_address: "Brooklyn, NY", photo_url: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600", status: "searching", created_at: new Date(Date.now()-1000*60*60*30).toISOString() },
  { id: "s3", name: "Mochi", species: "Dog", breed: "Shiba Inu", color: "Tan", last_seen_address: "Shibuya, Tokyo", photo_url: "https://images.unsplash.com/photo-1612536057832-2ff7ead58194?w=600", status: "found", created_at: new Date(Date.now()-1000*60*60*48).toISOString() },
];

function LostPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [open, setOpen] = useState(false);
  const [sightOpen, setSightOpen] = useState(false);
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
          <GhostButton onClick={() => setSightOpen(true)}><Search className="h-4 w-4" /> I saw an animal</GhostButton>
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
        {sightOpen && <SightingDialog onClose={() => setSightOpen(false)} userId={user?.id ?? null} reports={reports} />}
      </AnimatePresence>
    </>
  );
}

function SearchMap({ reports }: { reports: Report[] }) {
  // Live Windy.com embedded map — real wind/weather overlay for predictive search.
  return (
    <div className="relative h-[420px] overflow-hidden rounded-md border border-white/10 bg-[oklch(0.1_0.025_260)]">
      <iframe
        title="Windy live wind & weather map"
        src="https://embed.windy.com/embed2.html?lat=20&lon=0&zoom=2&level=surface&overlay=wind&menu=&message=true&marker=&calendar=&pressure=&type=map&location=coordinates&detail=&detailLat=20&detailLon=0&metricWind=default&metricTemp=default&radarRange=-1"
        className="absolute inset-0 h-full w-full"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,oklch(0.05_0.02_260/0.55)_100%)]" />
      <div className="absolute bottom-3 left-3 rounded-md border border-white/10 bg-black/60 px-3 py-2 text-[10px] font-mono uppercase tracking-widest backdrop-blur">
        <div className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[var(--neon-pink)] shadow-[0_0_6px_currentColor]" /> {reports.filter(r=>r.status!=="found").length} searching</div>
        <div className="mt-1 flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[var(--neon-emerald)] shadow-[0_0_6px_currentColor]" /> {reports.filter(r=>r.status==="found").length} reunited</div>
      </div>
      <div className="absolute right-3 top-3 rounded-md border border-[var(--neon-cyan)]/40 bg-[var(--neon-cyan)]/80 px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-black">Live wind · Windy.com</div>
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
      const { contact, ...rest } = form;
      const { data: inserted, error } = await supabase.from("lost_reports").insert({
        owner_id: userId, ...rest, photo_url, last_seen_at: new Date().toISOString(),
      }).select("id").single();
      if (error) { toast.error(error.message); return; }
      if (contact && inserted?.id) {
        await supabase.from("lost_report_contacts").insert({
          lost_report_id: inserted.id, owner_id: userId, contact,
        });
      }
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

function SightingDialog({ onClose, userId, reports }: { onClose: () => void; userId: string | null; reports: Report[] }) {
  const [form, setForm] = useState({ description: "", location: "", lost_report_id: "" });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const useMyLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not available");
    navigator.geolocation.getCurrentPosition(
      (p) => { setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }); toast.success("Location captured"); },
      () => toast.error("Couldn't get location"),
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) { toast.error("Sign in to submit a sighting"); return; }
    setBusy(true);
    try {
      let photo_url: string | null = null;
      if (imgFile) {
        const path = `${userId}/sightings/${crypto.randomUUID()}-${imgFile.name}`;
        const { error } = await supabase.storage.from("anima-media").upload(path, imgFile);
        if (!error) {
          const { data } = await supabase.storage.from("anima-media").createSignedUrl(path, 60 * 60 * 24 * 365);
          photo_url = data?.signedUrl ?? null;
        }
      }
      const { error } = await supabase.from("sightings").insert({
        reporter_id: userId,
        description: `${form.description}${form.location ? ` · near ${form.location}` : ""}`,
        lat: coords?.lat ?? null, lng: coords?.lng ?? null,
        photo_url, lost_report_id: form.lost_report_id || null,
      });
      if (error) throw error;
      toast.success("Sighting reported — owners notified");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit");
    } finally { setBusy(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose} className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur sm:items-center sm:p-6">
      <motion.form initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}
        onClick={(e) => e.stopPropagation()} onSubmit={submit}
        className="glass-strong w-full max-w-lg space-y-3 overflow-y-auto rounded-t-2xl p-6 sm:rounded-xl">
        <div className="flex items-center gap-2"><Search className="h-5 w-5 text-[var(--neon-emerald)]" /><h3 className="font-display text-xl font-semibold">Report a sighting</h3></div>
        <p className="text-xs text-muted-foreground">Help reunite lost animals. Your report alerts owners with matching searches nearby.</p>
        <SimpleField label="What did you see?" v={form.description} on={(v) => setForm({ ...form, description: v })} required />
        <SimpleField label="Approximate location" v={form.location} on={(v) => setForm({ ...form, location: v })} />
        <div>
          <span className="mb-1 block text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Match to active search (optional)</span>
          <select value={form.lost_report_id} onChange={(e) => setForm({ ...form, lost_report_id: e.target.value })}
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm">
            <option value="">— none —</option>
            {reports.filter(r => r.status !== "found" && !r.id.startsWith("s")).map(r => (
              <option key={r.id} value={r.id}>{r.name} · {r.species}{r.breed ? ` · ${r.breed}` : ""}</option>
            ))}
          </select>
        </div>
        <label className="block">
          <span className="mb-1 block text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Photo (optional)</span>
          <input type="file" accept="image/*" onChange={(e) => setImgFile(e.target.files?.[0] ?? null)} className="w-full rounded-md border border-white/10 bg-white/5 p-2 text-sm" />
        </label>
        <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 p-2 text-xs">
          <span className="font-mono text-muted-foreground">
            {coords ? `📍 ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : "GPS not set"}
          </span>
          <button type="button" onClick={useMyLocation} className="rounded border border-[var(--neon-cyan)]/40 bg-[var(--neon-cyan)]/10 px-2 py-1 text-[var(--neon-cyan)]">Use my location</button>
        </div>
        <div className="flex gap-2 pt-2">
          <NeonButton type="submit" disabled={busy || !form.description}>{busy ? "Submitting…" : "Submit sighting"}</NeonButton>
          <GhostButton type="button" onClick={onClose}>Cancel</GhostButton>
        </div>
      </motion.form>
    </motion.div>
  );
}