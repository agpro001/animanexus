import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, PageSection } from "@/components/anima/page";
import { GlassCard, NeonButton, FadeIn } from "@/components/anima/ui";
import { Send, Mail, MapPin, Instagram, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";

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
              <div className="grid gap-3">
                <ContactRow
                  href="mailto:adityagupta1234.in@gmail.com"
                  color="var(--neon-cyan)"
                  label="Email"
                  value="adityagupta1234.in@gmail.com"
                  Icon={<EmailLogo3D />}
                />
                <ContactRow
                  href="https://instagram.com/agpro001"
                  color="var(--neon-pink)"
                  label="Instagram"
                  value="@agpro001"
                  Icon={<InstagramLogo3D />}
                />
                <ContactRow
                  href="https://x.com/agpro001"
                  color="var(--neon-violet)"
                  label="X (Twitter)"
                  value="@agpro001"
                  Icon={<XLogo3D />}
                />
                <div className="mt-2 flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-[var(--neon-cyan)]" /> Earth · 64 ecosystems
                </div>
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

function ContactRow({ href, color, label, value, Icon }: { href: string; color: string; label: string; value: string; Icon: React.ReactNode }) {
  return (
    <motion.a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel="noopener noreferrer"
      whileHover={{ y: -2 }}
      className="group flex items-center gap-3 rounded-xl border border-white/10 bg-[linear-gradient(140deg,oklch(0.2_0.04_270/0.6),oklch(0.13_0.025_260/0.7))] p-3 transition-shadow hover:shadow-[0_18px_40px_-18px_var(--row-c)]"
      style={{ ["--row-c" as string]: color } as React.CSSProperties}
    >
      <div className="relative h-12 w-12 shrink-0" style={{ perspective: 600 }}>
        <div className="absolute inset-0 animate-pulse-glow rounded-xl" style={{ background: `radial-gradient(circle, ${color}55, transparent 70%)` }} />
        <div className="relative h-full w-full">{Icon}</div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-widest" style={{ color }}>{label}</div>
        <div className="truncate font-display text-sm font-medium text-foreground">{value}</div>
      </div>
      <ExternalLink className="h-4 w-4 text-muted-foreground transition group-hover:text-foreground" />
    </motion.a>
  );
}

function EmailLogo3D() {
  return (
    <motion.svg
      viewBox="0 0 64 64"
      className="h-full w-full drop-shadow-[0_0_8px_var(--neon-cyan)]"
      animate={{ rotateY: [0, 18, 0, -18, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      style={{ transformStyle: "preserve-3d" }}
    >
      <defs>
        <linearGradient id="mg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.85 0.18 200)" />
          <stop offset="100%" stopColor="oklch(0.75 0.24 300)" />
        </linearGradient>
      </defs>
      <rect x="8" y="16" width="48" height="32" rx="5" fill="url(#mg)" opacity="0.18" stroke="url(#mg)" strokeWidth="1.5" />
      <path d="M10 20 L32 36 L54 20" fill="none" stroke="url(#mg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <motion.circle cx="32" cy="32" r="3" fill="oklch(0.85 0.18 200)"
        animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }}
        transition={{ duration: 2, repeat: Infinity }} />
    </motion.svg>
  );
}

function InstagramLogo3D() {
  return (
    <motion.div
      className="relative h-full w-full"
      animate={{ rotateY: [0, 360] }}
      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      style={{ transformStyle: "preserve-3d" }}
    >
      <svg viewBox="0 0 64 64" className="h-full w-full drop-shadow-[0_0_10px_oklch(0.75_0.24_0)]">
        <defs>
          <linearGradient id="ig" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#feda75" />
            <stop offset="40%" stopColor="#fa7e1e" />
            <stop offset="70%" stopColor="#d62976" />
            <stop offset="100%" stopColor="#962fbf" />
          </linearGradient>
        </defs>
        <rect x="10" y="10" width="44" height="44" rx="12" fill="none" stroke="url(#ig)" strokeWidth="3" />
        <circle cx="32" cy="32" r="10" fill="none" stroke="url(#ig)" strokeWidth="3" />
        <circle cx="46" cy="18" r="2.5" fill="url(#ig)" />
      </svg>
    </motion.div>
  );
}

function XLogo3D() {
  return (
    <motion.svg
      viewBox="0 0 64 64"
      className="h-full w-full drop-shadow-[0_0_8px_oklch(0.75_0.24_300)]"
      animate={{ rotateX: [0, 20, 0, -20, 0], rotateZ: [0, 4, 0, -4, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
    >
      <defs>
        <linearGradient id="xg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.97 0.01 240)" />
          <stop offset="100%" stopColor="oklch(0.75 0.24 300)" />
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="52" height="52" rx="12" fill="oklch(0.1 0.02 260)" stroke="url(#xg)" strokeWidth="1.5" />
      <path d="M18 18 L46 46 M46 18 L18 46" stroke="url(#xg)" strokeWidth="4" strokeLinecap="round" />
    </motion.svg>
  );
}