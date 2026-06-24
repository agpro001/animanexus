import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, PageSection } from "@/components/anima/page";
import { GlassCard, NeonButton, FadeIn } from "@/components/anima/ui";
import { Heart, Home, Users, Sparkles } from "lucide-react";
import { analyze } from "@/lib/anima-helpers";
import { toast } from "sonner";

export const Route = createFileRoute("/shelter")({
  head: () => ({ meta: [{ title: "Shelter & Adoption Matching — ANIMA Nexus" }, { name: "description", content: "AI-ranked adopter compatibility for shelter animals." }] }),
  component: ShelterPage,
});

type Pet = { id: string; name: string; species: string; energy: number; friendliness: number; needs_yard: boolean; good_with_kids: boolean; good_with_pets: boolean; photo: string; bio: string };

const PETS: Pet[] = [
  { id: "p1", name: "Maple", species: "Dog · Labrador mix", energy: 8, friendliness: 9, needs_yard: true, good_with_kids: true, good_with_pets: true, photo: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600", bio: "Bouncy retriever who loves long runs and water." },
  { id: "p2", name: "Saffron", species: "Cat · Tortoiseshell", energy: 4, friendliness: 6, needs_yard: false, good_with_kids: false, good_with_pets: false, photo: "https://images.unsplash.com/photo-1606214174585-fe31582dc6ee?w=600", bio: "Quiet, independent cat — perfect for a calm one-person apartment." },
  { id: "p3", name: "Biscuit", species: "Dog · Beagle", energy: 7, friendliness: 9, needs_yard: false, good_with_kids: true, good_with_pets: true, photo: "https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=600", bio: "Curious beagle who thrives with kids and other pets." },
  { id: "p4", name: "Echo", species: "Cat · Siamese", energy: 6, friendliness: 8, needs_yard: false, good_with_kids: true, good_with_pets: true, photo: "https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=600", bio: "Vocal, social cat who follows you everywhere." },
];

type Match = { id: string; pet: Pet; score: number; lifestyle_fit: number; energy_fit: number; home_fit: number; reasoning: string; concerns: string[] };

function ShelterPage() {
  const [form, setForm] = useState({ home: "Apartment", yard: "No", hours: "8", kids: "No", pets: "No", activity: "Moderate", experience: "Some" });
  const [busy, setBusy] = useState(false);
  const [matches, setMatches] = useState<Match[] | null>(null);

  const run = async () => {
    setBusy(true); setMatches(null);
    const results: Match[] = [];
    for (const pet of PETS) {
      const r = await analyze<Omit<Match, "id"|"pet">>("shelter_match", {
        prompt: `Adopter profile: home=${form.home}, yard=${form.yard}, hours away/day=${form.hours}, kids=${form.kids}, other pets=${form.pets}, activity=${form.activity}, experience=${form.experience}. Animal: ${pet.name} (${pet.species}) energy=${pet.energy}/10, friendliness=${pet.friendliness}/10, needs_yard=${pet.needs_yard}, good_with_kids=${pet.good_with_kids}, good_with_pets=${pet.good_with_pets}. Bio: ${pet.bio}`,
      });
      if (r.result) results.push({ id: pet.id, pet, ...r.result });
    }
    results.sort((a, b) => b.score - a.score);
    setMatches(results);
    setBusy(false);
    if (!results.length) toast.error("Could not compute matches");
  };

  return (
    <>
      <PageHeader eyebrow="Module · Shelter & Adoption" title={<>The right home, <span className="text-gradient">found by AI.</span></>}
        kicker="Compatibility scoring matches each animal to the family they'll actually thrive in." />
      <PageSection>
        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <FadeIn>
            <GlassCard glow="violet">
              <h3 className="flex items-center gap-2 font-display text-lg font-semibold"><Users className="h-5 w-5 text-[var(--neon-violet)]" /> Adopter profile</h3>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Select label="Home" v={form.home} on={(v) => setForm({ ...form, home: v })} opts={["Apartment","House","Farm"]} />
                <Select label="Yard" v={form.yard} on={(v) => setForm({ ...form, yard: v })} opts={["Yes","No"]} />
                <Select label="Hours away/day" v={form.hours} on={(v) => setForm({ ...form, hours: v })} opts={["0","4","8","12"]} />
                <Select label="Kids at home" v={form.kids} on={(v) => setForm({ ...form, kids: v })} opts={["Yes","No"]} />
                <Select label="Other pets" v={form.pets} on={(v) => setForm({ ...form, pets: v })} opts={["Yes","No"]} />
                <Select label="Activity level" v={form.activity} on={(v) => setForm({ ...form, activity: v })} opts={["Low","Moderate","Active","Athlete"]} />
                <Select label="Experience" v={form.experience} on={(v) => setForm({ ...form, experience: v })} opts={["First-time","Some","Experienced"]} />
              </div>
              <NeonButton onClick={run} disabled={busy} className="mt-5 w-full">{busy ? "Matching…" : "Find best matches"} <Sparkles className="h-4 w-4" /></NeonButton>
            </GlassCard>
          </FadeIn>
          <FadeIn delay={0.08}>
            <div className="space-y-3">
              {(matches ?? PETS.map((p) => ({ id: p.id, pet: p, score: 0, lifestyle_fit: 0, energy_fit: 0, home_fit: 0, reasoning: "Run the matcher to see how this animal fits your lifestyle.", concerns: [] }))).map((m, i) => (
                <FadeIn key={m.id} delay={i * 0.05}>
                  <MatchCard m={m as Match} hasScore={!!matches} />
                </FadeIn>
              ))}
            </div>
          </FadeIn>
        </div>
      </PageSection>
    </>
  );
}

function MatchCard({ m, hasScore }: { m: Match; hasScore: boolean }) {
  return (
    <GlassCard className="p-0 overflow-hidden">
      <div className="flex gap-0">
        <div className="h-32 w-32 shrink-0 overflow-hidden">
          <img src={m.pet.photo} alt={m.pet.name} className="h-full w-full object-cover" />
        </div>
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-display text-lg font-semibold">{m.pet.name}</div>
              <div className="text-xs text-muted-foreground">{m.pet.species}</div>
            </div>
            {hasScore && (
              <div className="text-right">
                <div className="font-display text-2xl font-semibold text-[var(--neon-cyan)]">{Math.round(m.score)}%</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Match</div>
              </div>
            )}
          </div>
          {hasScore && (
            <div className="mt-2 grid grid-cols-3 gap-2 text-[10px]">
              <Bar label="Lifestyle" v={m.lifestyle_fit} c="var(--neon-cyan)" />
              <Bar label="Energy" v={m.energy_fit} c="var(--neon-violet)" />
              <Bar label="Home" v={m.home_fit} c="var(--neon-emerald)" />
            </div>
          )}
          <p className="mt-2 text-sm text-foreground/80">{m.reasoning || m.pet.bio}</p>
          {m.concerns?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {m.concerns.map((c, i) => <span key={i} className="rounded-full border border-[var(--neon-amber)]/40 bg-[var(--neon-amber)]/10 px-2 py-0.5 text-[10px] text-[var(--neon-amber)]">{c}</span>)}
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

function Bar({ label, v, c }: { label: string; v: number; c: string }) {
  return (
    <div>
      <div className="flex items-center justify-between"><span className="font-mono uppercase tracking-widest text-muted-foreground">{label}</span><span style={{ color: c }}>{Math.round(v)}</span></div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, v))}%`, background: c, boxShadow: `0 0 6px ${c}` }} />
      </div>
    </div>
  );
}

function Select({ label, v, on, opts }: { label: string; v: string; on: (s: string) => void; opts: string[] }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
      <select value={v} onChange={(e) => on(e.target.value)} className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-[var(--neon-cyan)]/50">
        {opts.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}