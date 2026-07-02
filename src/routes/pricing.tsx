import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Check, Zap, Crown, Loader2, Sparkles, ShieldCheck, CreditCard } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { fetchStatus, startCheckout, openPortal, confirmSession, type EntitlementStatus } from "@/lib/billing";

type Search = { status?: "success" | "cancel"; session_id?: string };

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
  validateSearch: (s: Record<string, unknown>): Search => ({
    status: s.status === "success" || s.status === "cancel" ? s.status : undefined,
    session_id: typeof s.session_id === "string" ? s.session_id : undefined,
  }),
});

function PricingPage() {
  const { user } = useAuth();
  const search = useSearch({ from: "/pricing" });
  const [ent, setEnt] = useState<EntitlementStatus | null>(null);
  const [busy, setBusy] = useState<"single" | "monthly" | "portal" | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<boolean>(false);

  useEffect(() => { void refresh(); }, [user]);
  async function refresh() { try { setEnt(await fetchStatus()); } catch { /* noop */ } }

  useEffect(() => {
    (async () => {
      if (search.status === "success" && search.session_id && !confirmed) {
        setConfirmed(true);
        await confirmSession(search.session_id);
        await refresh();
      }
    })();
  }, [search.status, search.session_id, confirmed]);

  const go = async (plan: "single" | "monthly") => {
    setErr(null); setBusy(plan);
    try { await startCheckout(plan); }
    catch (e) { setErr((e as Error).message); setBusy(null); }
  };
  const portal = async () => {
    setErr(null); setBusy("portal");
    try { await openPortal(); }
    catch (e) { setErr((e as Error).message); setBusy(null); }
  };

  return (
    <div className="relative overflow-hidden">
      <BackdropOrbs />
      <section className="relative mx-auto max-w-6xl px-4 pb-24 pt-16 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-[var(--neon-cyan)]">
            <Sparkles className="h-3 w-3" /> Simple, honest pricing
          </div>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            <span className="text-gradient">Every animal</span> deserves a guardian
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
            Every new account gets <b>3 free AI runs</b> across every module. After that, pay just
            <b> $0.50 per use</b> or go unlimited for <b>$4/month</b>.
          </p>
        </motion.div>

        {search.status === "success" && (
          <div className="mx-auto mt-6 max-w-xl rounded-lg border border-[var(--neon-cyan)]/40 bg-[var(--neon-cyan)]/10 p-3 text-center text-sm">
            Payment received — your entitlement has been updated. Thank you! 🎉
          </div>
        )}
        {search.status === "cancel" && (
          <div className="mx-auto mt-6 max-w-xl rounded-lg border border-white/10 bg-white/5 p-3 text-center text-sm text-muted-foreground">
            Checkout canceled — no charge was made.
          </div>
        )}

        <EntitlementBar ent={ent} onPortal={portal} portalBusy={busy === "portal"} />

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <Plan
            highlight={false}
            icon={<Sparkles className="h-5 w-5" />}
            title="Free Trial"
            price="$0"
            sub="3 free AI runs · every new account"
            features={["Full access to every module","Chatbot, Health, Audio, Wildlife","No credit card required"]}
            cta={user ? "Included with your account" : "Create free account"}
            to={user ? undefined : "/auth"}
            onClick={undefined}
            busy={false}
            delay={0}
          />
          <Plan
            highlight={false}
            icon={<Zap className="h-5 w-5" />}
            title="Pay as you go"
            price="$0.50"
            sub="per AI use · buy once"
            features={["No subscription","Credits never expire","Perfect for occasional use"]}
            cta={user ? "Buy one credit" : "Sign in to buy"}
            to={user ? undefined : "/auth"}
            onClick={user ? () => go("single") : undefined}
            busy={busy === "single"}
            delay={0.08}
          />
          <Plan
            highlight
            icon={<Crown className="h-5 w-5" />}
            title="Unlimited"
            price="$4"
            sub="per month · cancel anytime"
            features={["Unlimited AI across all modules","Priority routing & faster streaming","Full Wildlife live feed access","Early access to new features"]}
            cta={user ? "Start subscription" : "Sign in to subscribe"}
            to={user ? undefined : "/auth"}
            onClick={user ? () => go("monthly") : undefined}
            busy={busy === "monthly"}
            delay={0.16}
          />
        </div>

        {err && (
          <div className="mx-auto mt-6 max-w-xl rounded-md border border-[var(--neon-pink)]/40 bg-[var(--neon-pink)]/10 p-3 text-center text-xs text-[var(--neon-pink)]">
            {err}
          </div>
        )}

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-[var(--neon-cyan)]" /> Secure Stripe checkout</span>
          <span className="inline-flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5 text-[var(--neon-violet)]" /> Cancel anytime</span>
          <Link to="/security" className="underline hover:text-foreground">Security audit →</Link>
        </div>
      </section>
    </div>
  );
}

function EntitlementBar({ ent, onPortal, portalBusy }: { ent: EntitlementStatus | null; onPortal: () => void; portalBusy: boolean }) {
  if (!ent) return null;
  if (!ent.authenticated) {
    return (
      <div className="mx-auto mt-8 max-w-2xl rounded-xl border border-white/10 bg-white/5 p-4 text-center text-sm">
        <span className="text-muted-foreground">Sign in to see your remaining free AI runs and credits.</span>
        <Link to="/auth" className="ml-2 font-semibold text-[var(--neon-cyan)] hover:underline">Sign in →</Link>
      </div>
    );
  }
  const active = ent.subscribed;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
      className="glass-strong mx-auto mt-8 grid max-w-3xl gap-3 rounded-2xl border border-white/10 p-4 sm:grid-cols-3"
    >
      <Stat label="Free runs left" value={String(ent.free_remaining ?? 0)} accent="var(--neon-cyan)" />
      <Stat label="Paid credits" value={String(ent.paid_credits ?? 0)} accent="var(--neon-violet)" />
      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Subscription</div>
          <div className={`mt-1 text-sm font-semibold ${active ? "text-[var(--neon-cyan)]" : "text-muted-foreground"}`}>
            {active ? "Active · Unlimited" : "Inactive"}
          </div>
        </div>
        <button onClick={onPortal} disabled={portalBusy}
          className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10">
          {portalBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : "Manage"}
        </button>
      </div>
    </motion.div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold" style={{ color: accent }}>{value}</div>
    </div>
  );
}

function Plan({
  icon, title, price, sub, features, cta, to, onClick, busy, highlight, delay,
}: {
  icon: React.ReactNode; title: string; price: string; sub: string;
  features: string[]; cta: string; to?: string; onClick?: () => void; busy: boolean; highlight: boolean; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotateX: 12 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ delay, type: "spring", stiffness: 160, damping: 20 }}
      whileHover={{ y: -8, rotateX: -3, rotateY: 3, transition: { type: "spring", stiffness: 240, damping: 18 } }}
      style={{ transformStyle: "preserve-3d", perspective: 800 }}
      className={`relative overflow-hidden rounded-2xl border p-6 backdrop-blur-xl ${
        highlight
          ? "border-[var(--neon-cyan)]/50 bg-gradient-to-br from-[var(--neon-cyan)]/15 via-[var(--neon-violet)]/10 to-transparent shadow-[0_20px_60px_-20px_var(--neon-cyan)]"
          : "border-white/10 bg-white/[0.04]"
      }`}
    >
      {highlight && (
        <div className="absolute right-4 top-4 rounded-full border border-[var(--neon-cyan)]/40 bg-[var(--neon-cyan)]/15 px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest text-[var(--neon-cyan)]">
          Most popular
        </div>
      )}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute -inset-x-8 top-0 h-24 opacity-40"
        style={{ background: "radial-gradient(closest-side, var(--neon-cyan), transparent)" }}
        animate={{ y: [-24, 8, -24] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="flex items-center gap-2 text-[var(--neon-cyan)]">
        {icon} <span className="text-xs font-mono uppercase tracking-widest">{title}</span>
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="font-display text-5xl font-bold">{price}</span>
        {title === "Unlimited" && <span className="text-sm text-muted-foreground">/ mo</span>}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
      <ul className="mt-5 space-y-2 text-sm">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 flex-none text-[var(--neon-cyan)]" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      {to ? (
        <Link to={to as never} className={ctaClass(highlight)}>{cta}</Link>
      ) : (
        <button onClick={onClick} disabled={busy || !onClick} className={ctaClass(highlight)}>
          {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Opening checkout…</> : cta}
        </button>
      )}
    </motion.div>
  );
}

function ctaClass(highlight: boolean) {
  return `mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
    highlight
      ? "bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-violet)] text-[oklch(0.12_0.02_260)] shadow-[0_10px_30px_-10px_var(--neon-cyan)] hover:brightness-110"
      : "border border-white/15 bg-white/5 hover:bg-white/10"
  }`;
}

function BackdropOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute -left-24 top-10 h-80 w-80 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle,var(--neon-cyan),transparent 60%)", opacity: 0.35 }}
        animate={{ x: [0, 40, 0], y: [0, 20, 0] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-24 top-40 h-96 w-96 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle,var(--neon-violet),transparent 60%)", opacity: 0.3 }}
        animate={{ x: [0, -50, 0], y: [0, -20, 0] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}