import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Crown, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { startCheckout } from "@/lib/billing";
import { useAuth } from "@/lib/auth";

export function PaywallModal({ open, onClose, reason }: { open: boolean; onClose: () => void; reason?: string }) {
  const [busy, setBusy] = useState<"single" | "monthly" | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const { user } = useAuth();

  const go = async (plan: "single" | "monthly") => {
    setErr(null); setBusy(plan);
    try { await startCheckout(plan); }
    catch (e) { setErr((e as Error).message); setBusy(null); }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 240, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/15 p-6"
          >
            <button onClick={onClose} className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
            <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--neon-cyan)]">
              {reason === "auth_required" ? "Sign in required" : "Free uses exhausted"}
            </div>
            <h2 className="mt-1 font-display text-2xl font-semibold">
              {reason === "auth_required" ? "Sign in to keep using AI" : "You've used your 3 free AI runs"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {reason === "auth_required"
                ? "Create an account or sign in — every new user gets 3 free AI uses."
                : "Pick a plan to continue. Cancel any time."}
            </p>

            {!user ? (
              <Link to="/auth" onClick={onClose}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-violet)] px-4 py-2 text-sm font-semibold text-[oklch(0.12_0.02_260)]">
                Sign in / Sign up
              </Link>
            ) : (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <PlanCard
                  icon={<Zap className="h-5 w-5" />}
                  title="Pay as you go"
                  price="$0.50"
                  sub="per AI use · one-time"
                  onClick={() => go("single")}
                  busy={busy === "single"}
                  variant="ghost"
                />
                <PlanCard
                  icon={<Crown className="h-5 w-5" />}
                  title="Unlimited"
                  price="$4"
                  sub="per month · unlimited AI"
                  onClick={() => go("monthly")}
                  busy={busy === "monthly"}
                  variant="primary"
                />
              </div>
            )}
            {err && <div className="mt-3 rounded-md border border-[var(--neon-pink)]/40 bg-[var(--neon-pink)]/10 p-2 text-xs text-[var(--neon-pink)]">{err}</div>}
            <div className="mt-4 text-center text-[11px] text-muted-foreground">
              <Link to="/pricing" onClick={onClose} className="underline hover:text-foreground">See full pricing →</Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PlanCard({ icon, title, price, sub, onClick, busy, variant }: {
  icon: React.ReactNode; title: string; price: string; sub: string;
  onClick: () => void; busy: boolean; variant: "primary" | "ghost";
}) {
  return (
    <motion.button
      whileHover={{ y: -3, rotateX: -4, rotateY: 4 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
      onClick={onClick} disabled={busy}
      style={{ transformStyle: "preserve-3d", perspective: 600 }}
      className={`relative overflow-hidden rounded-xl border p-4 text-left transition ${
        variant === "primary"
          ? "border-[var(--neon-cyan)]/40 bg-gradient-to-br from-[var(--neon-cyan)]/15 to-[var(--neon-violet)]/15"
          : "border-white/10 bg-white/5 hover:bg-white/10"
      }`}
    >
      <div className="flex items-center gap-2 text-[var(--neon-cyan)]">{icon}<span className="text-xs font-mono uppercase tracking-widest">{title}</span></div>
      <div className="mt-2 font-display text-3xl font-bold">{price}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
      <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold">
        {busy ? <><Loader2 className="h-3 w-3 animate-spin" /> Opening…</> : "Continue →"}
      </div>
    </motion.button>
  );
}