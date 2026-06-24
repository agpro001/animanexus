import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, PageSection } from "@/components/anima/page";
import { GlassCard, NeonButton, FadeIn } from "@/components/anima/ui";
import { Send, Mail, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact — ANIMA Nexus" }, { name: "description", content: "Get in touch with the ANIMA Nexus team." }] }),
  component: ContactPage,
});

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const { error } = await supabase.from("contact_messages").insert(form);
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("Message received — we'll be in touch"); setForm({ name: "", email: "", message: "" }); }
  };
  return (
    <>
      <PageHeader eyebrow="Contact" title={<>Let's <span className="text-gradient">talk.</span></>} kicker="Partnerships, shelters, conservation teams, or just an idea." />
      <PageSection>
        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <FadeIn>
            <GlassCard glow="cyan">
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-[var(--neon-cyan)]" /> hello@anima-nexus.ai</div>
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[var(--neon-cyan)]" /> Earth · 64 ecosystems</div>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">For emergencies involving your own animal, please use the Emergency module or call your vet directly.</p>
            </GlassCard>
          </FadeIn>
          <FadeIn delay={0.06}>
            <GlassCard>
              <form onSubmit={submit} className="grid gap-3">
                <input required maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm" />
                <input required maxLength={200} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm" />
                <textarea required maxLength={2000} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={5} placeholder="What's on your mind?" className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm" />
                <NeonButton type="submit" disabled={busy}>{busy ? "Sending…" : "Send"} <Send className="h-4 w-4" /></NeonButton>
              </form>
            </GlassCard>
          </FadeIn>
        </div>
      </PageSection>
    </>
  );
}