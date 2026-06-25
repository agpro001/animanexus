import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export function BackButton({ fallback = "/" }: { fallback?: string }) {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname === "/") return null;
  const onBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) router.history.back();
    else router.navigate({ to: fallback });
  };
  return (
    <button
      onClick={onBack}
      aria-label="Go back"
      className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur transition hover:border-[var(--neon-cyan)]/40 hover:bg-[var(--neon-cyan)]/10 hover:text-[var(--neon-cyan)]"
    >
      <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
      Back
    </button>
  );
}

export function PageHeader({ eyebrow, title, kicker, children }: { eyebrow: string; title: ReactNode; kicker?: string; children?: ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-6 pt-12 pb-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="mb-3 flex items-center gap-2"><BackButton /></div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-[var(--neon-cyan)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--neon-cyan)] shadow-[0_0_8px_currentColor]" />
          {eyebrow}
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">{title}</h1>
        {kicker && <p className="mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">{kicker}</p>}
        {children}
      </motion.div>
    </div>
  );
}

export function PageSection({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={`mx-auto max-w-7xl px-6 py-6 ${className ?? ""}`}>{children}</section>;
}

export function AuthGate({ children }: { children: ReactNode }) {
  return <>{children}</>;
}