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
};

/**
 * 3D animated tilt-cube button.
 * Uses CSS perspective + transform-style:preserve-3d for a real 3D feel,
 * with pointer-tracked tilt, neon glow, and an animated reflective face.
 */
export function FeatureCube({ to, label, icon: Icon, color, delay = 0 }: FeatureCubeProps) {
  const ref = useRef<HTMLAnchorElement>(null);

  const handleMove = (e: MouseEvent<HTMLAnchorElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const rx = (0.5 - py) * 22;
    const ry = (px - 0.5) * 26;
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
      initial={{ opacity: 0, y: 24, rotateX: -20 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay, ease: "easeOut" }}
      style={{ perspective: 900 }}
    >
      <Link
        ref={ref}
        to={to as never}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        className="feature-cube group relative block aspect-square w-full select-none rounded-2xl"
        style={
          {
            "--cube-color": color,
          } as React.CSSProperties
        }
      >
        <div className="cube-face relative h-full w-full rounded-2xl border border-white/10 bg-[linear-gradient(160deg,oklch(0.22_0.04_270/0.7),oklch(0.12_0.025_260/0.85))] p-3 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)] transition-shadow group-hover:shadow-[0_30px_60px_-20px_var(--cube-color)]">
          {/* edge highlight */}
          <span className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_var(--mx,50%)_var(--my,30%),color-mix(in_oklab,var(--cube-color)_50%,transparent)_0%,transparent_55%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          {/* scan grid */}
          <span
            className="pointer-events-none absolute inset-0 rounded-2xl opacity-25"
            style={{
              backgroundImage:
                "linear-gradient(var(--cube-color) 1px,transparent 1px),linear-gradient(90deg,var(--cube-color) 1px,transparent 1px)",
              backgroundSize: "18px 18px",
              maskImage: "radial-gradient(circle at center,black 30%,transparent 75%)",
              WebkitMaskImage: "radial-gradient(circle at center,black 30%,transparent 75%)",
            }}
          />
          {/* floating icon */}
          <div
            className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-[60%] items-center justify-center rounded-xl border border-white/15"
            style={{
              background: `color-mix(in oklab, ${color} 25%, oklch(0.15 0.03 260))`,
              transform: "translate(-50%,-60%) translateZ(34px)",
              boxShadow: `0 0 18px ${color}, inset 0 0 14px color-mix(in oklab, ${color} 40%, transparent)`,
            }}
          >
            <Icon className="h-6 w-6" style={{ color }} />
          </div>
          {/* label */}
          <div
            className="absolute inset-x-2 bottom-2 rounded-md border border-white/10 bg-black/30 px-2 py-1.5 text-center font-display text-[12px] font-semibold tracking-tight"
            style={{ transform: "translateZ(20px)", color: "oklch(0.97 0.01 240)" }}
          >
            {label}
          </div>
          {/* corner ticks */}
          <span className="pointer-events-none absolute left-1.5 top-1.5 h-2 w-2 border-l border-t" style={{ borderColor: color }} />
          <span className="pointer-events-none absolute right-1.5 top-1.5 h-2 w-2 border-r border-t" style={{ borderColor: color }} />
          <span className="pointer-events-none absolute left-1.5 bottom-1.5 h-2 w-2 border-b border-l" style={{ borderColor: color }} />
          <span className="pointer-events-none absolute right-1.5 bottom-1.5 h-2 w-2 border-b border-r" style={{ borderColor: color }} />
        </div>
      </Link>
    </motion.div>
  );
}
