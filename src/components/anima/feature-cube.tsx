import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { useRef, type MouseEvent } from "react";

export type FeatureCubeProps = {
  to: string;
  label: string;
  icon: LucideIcon;
  color: string;
  delay?: number;
  description?: string;
};

/**
 * 3D animated tilt-cube button.
 * Uses CSS perspective + transform-style:preserve-3d for a real 3D feel,
 * with pointer-tracked tilt, neon glow, and an animated reflective face.
 */
export function FeatureCube({ to, label, icon: Icon, color, delay = 0, description }: FeatureCubeProps) {
  const ref = useRef<HTMLAnchorElement>(null);

  const handleMove = (e: MouseEvent<HTMLAnchorElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const rx = (0.5 - py) * 28;
    const ry = (px - 0.5) * 32;
    el.style.setProperty("--rx", `${rx}deg`);
    el.style.setProperty("--ry", `${ry}deg`);
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
  };
  const handleLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", `0deg`);
    el.style.setProperty("--ry", `0deg`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 28, rotateX: -25, scale: 0.92 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
      whileHover={{ scale: 1.04, y: -4 }}
      whileTap={{ scale: 0.97 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{ perspective: 1100 }}
    >
      <Link
        ref={ref}
        to={to as never}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        className="feature-cube group relative block aspect-[4/5] w-full select-none rounded-2xl will-change-transform"
        style={
          {
            "--cube-color": color,
          } as React.CSSProperties
        }
      >
        <div className="cube-face relative h-full w-full overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(160deg,oklch(0.22_0.04_270/0.75),oklch(0.11_0.025_260/0.9))] p-4 shadow-[0_22px_55px_-22px_rgba(0,0,0,0.7)] transition-[box-shadow,transform] duration-300 ease-out group-hover:shadow-[0_38px_75px_-22px_var(--cube-color)]">
          {/* edge highlight */}
          <span className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_var(--mx,50%)_var(--my,30%),color-mix(in_oklab,var(--cube-color)_55%,transparent)_0%,transparent_60%)] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
          {/* scan grid */}
          <span
            className="pointer-events-none absolute inset-0 rounded-2xl opacity-30"
            style={{
              backgroundImage:
                "linear-gradient(var(--cube-color) 1px,transparent 1px),linear-gradient(90deg,var(--cube-color) 1px,transparent 1px)",
              backgroundSize: "22px 22px",
              maskImage: "radial-gradient(circle at center,black 35%,transparent 80%)",
              WebkitMaskImage: "radial-gradient(circle at center,black 35%,transparent 80%)",
            }}
          />
          {/* floating icon */}
          <div
            className="absolute left-1/2 top-[38%] flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border border-white/15 transition-transform duration-300 ease-out group-hover:scale-110"
            style={{
              background: `color-mix(in oklab, ${color} 28%, oklch(0.15 0.03 260))`,
              transform: "translate(-50%,-50%) translateZ(48px)",
              boxShadow: `0 0 26px ${color}, inset 0 0 18px color-mix(in oklab, ${color} 45%, transparent)`,
            }}
          >
            <Icon className="h-9 w-9" style={{ color }} />
          </div>
          {/* label + description */}
          <div
            className="absolute inset-x-2 bottom-2 rounded-lg border border-white/10 bg-black/40 px-2.5 py-2 text-center"
            style={{ transform: "translateZ(28px)" }}
          >
            <div className="font-display text-[13px] font-semibold tracking-tight text-foreground sm:text-sm">{label}</div>
            {description ? (
              <div className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-muted-foreground">{description}</div>
            ) : null}
          </div>
          {/* corner ticks */}
          <span className="pointer-events-none absolute left-2 top-2 h-2.5 w-2.5 border-l border-t" style={{ borderColor: color }} />
          <span className="pointer-events-none absolute right-2 top-2 h-2.5 w-2.5 border-r border-t" style={{ borderColor: color }} />
          <span className="pointer-events-none absolute left-2 bottom-2 h-2.5 w-2.5 border-b border-l" style={{ borderColor: color }} />
          <span className="pointer-events-none absolute right-2 bottom-2 h-2.5 w-2.5 border-b border-r" style={{ borderColor: color }} />
        </div>
      </Link>
    </motion.div>
  );
}
