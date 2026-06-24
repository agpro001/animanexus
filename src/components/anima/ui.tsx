import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function GlassCard({ children, className, glow, onClick }: { children: ReactNode; className?: string; glow?: "cyan"|"violet"|"emerald"; onClick?: () => void }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      onClick={onClick}
      className={cn(
        "glass p-5 transition-shadow",
        glow === "cyan" && "hover:shadow-[var(--shadow-glow-cyan)]",
        glow === "violet" && "hover:shadow-[var(--shadow-glow-violet)]",
        onClick && "cursor-pointer",
        className,
      )}>
      {children}
    </motion.div>
  );
}

export function StatRing({ value, label, color = "var(--neon-cyan)", size = 96 }: { value: number; label: string; color?: string; size?: number }) {
  const r = size/2 - 8;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, value))/100);
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="oklch(0.3 0.04 270 / 0.5)" strokeWidth="6" />
        <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: off }}
          transition={{ duration: 1.4, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
      </svg>
      <div className="-mt-[68%] text-center">
        <div className="font-display text-xl font-semibold">{Math.round(value)}</div>
        <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

export function AnimatedCounter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const duration = 1400;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const e = 1 - Math.pow(1 - p, 3);
      setN(Math.round(to * e));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);
  return <span ref={ref} className="font-display tabular-nums">{n.toLocaleString()}{suffix}</span>;
}

export function SectionHeading({ eyebrow, title, kicker, className }: { eyebrow?: string; title: ReactNode; kicker?: string; className?: string }) {
  return (
    <div className={cn("mx-auto max-w-3xl text-center", className)}>
      {eyebrow && (
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-[var(--neon-cyan)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--neon-cyan)] shadow-[0_0_8px_currentColor]" />
          {eyebrow}
        </div>
      )}
      <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">{title}</h2>
      {kicker && <p className="mt-4 text-base text-muted-foreground sm:text-lg">{kicker}</p>}
    </div>
  );
}

export function RiskBadge({ level }: { level: "low" | "moderate" | "high" | "critical" }) {
  const map = {
    low: ["bg-[oklch(0.8_0.2_165/0.15)] text-[var(--neon-emerald)] border-[var(--neon-emerald)]/40", "Low risk"],
    moderate: ["bg-[oklch(0.84_0.18_80/0.15)] text-[var(--neon-amber)] border-[var(--neon-amber)]/40", "Monitor"],
    high: ["bg-[oklch(0.75_0.24_0/0.15)] text-[var(--neon-pink)] border-[var(--neon-pink)]/40", "High risk"],
    critical: ["bg-[oklch(0.7_0.24_20/0.2)] text-[var(--color-destructive)] border-[var(--color-destructive)]/50", "Critical"],
  } as const;
  const [c, label] = map[level];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider", c)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current shadow-[0_0_8px_currentColor]" /> {label}
    </span>
  );
}

export function NeonButton({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button {...props} className={cn(
      "inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-violet)] px-5 py-2.5 text-sm font-semibold text-[oklch(0.12_0.02_260)] shadow-[var(--shadow-glow-cyan)] transition hover:brightness-110 disabled:opacity-50",
      className,
    )}>{children}</button>
  );
}

export function GhostButton({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button {...props} className={cn(
      "inline-flex items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-white/10",
      className,
    )}>{children}</button>
  );
}

export function FadeIn({ children, delay = 0, y = 16, className }: { children: ReactNode; delay?: number; y?: number; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }} className={className}>
      {children}
    </motion.div>
  );
}