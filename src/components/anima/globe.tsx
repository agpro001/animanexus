import { motion } from "framer-motion";

/**
 * Pseudo-3D animated globe of animal protection nodes.
 * Pure SVG + CSS, no three.js — keeps it lightweight and mobile-friendly.
 */
export function NexusGlobe({ size = 460 }: { size?: number }) {
  const rings = [
    { rx: size * 0.45, ry: size * 0.12, rot: 0, dur: 26 },
    { rx: size * 0.42, ry: size * 0.18, rot: 30, dur: 32 },
    { rx: size * 0.4, ry: size * 0.24, rot: 60, dur: 40 },
    { rx: size * 0.38, ry: size * 0.3, rot: 90, dur: 48 },
  ];
  const nodes = [
    { x: 0.2, y: 0.35, c: "var(--neon-cyan)" },
    { x: 0.75, y: 0.22, c: "var(--neon-violet)" },
    { x: 0.6, y: 0.75, c: "var(--neon-emerald)" },
    { x: 0.28, y: 0.78, c: "var(--neon-amber)" },
    { x: 0.85, y: 0.55, c: "var(--neon-pink)" },
    { x: 0.5, y: 0.12, c: "var(--neon-cyan)" },
  ];
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <div className="absolute inset-0 animate-pulse-glow rounded-full" style={{
        background: "radial-gradient(circle at 35% 30%, oklch(0.75 0.24 300 / 0.45), transparent 60%)",
      }} />
      <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
        <defs>
          <radialGradient id="globe-fill" cx="35%" cy="30%">
            <stop offset="0%" stopColor="oklch(0.4 0.08 270)" />
            <stop offset="100%" stopColor="oklch(0.12 0.02 260)" />
          </radialGradient>
          <linearGradient id="ring-stroke" x1="0" x2="1">
            <stop offset="0%" stopColor="oklch(0.85 0.18 200 / 0.7)" />
            <stop offset="100%" stopColor="oklch(0.75 0.24 300 / 0.7)" />
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={size*0.36} fill="url(#globe-fill)" stroke="oklch(0.5 0.05 270 / 0.4)" strokeWidth="1" />
        {/* lat/long grid */}
        {[0.18, 0.28, 0.36, 0.32, 0.22].map((rr, i) => (
          <ellipse key={i} cx={size/2} cy={size/2} rx={size*0.36} ry={size*rr} fill="none" stroke="oklch(0.7 0.05 250 / 0.18)" />
        ))}
        {[0,30,60,90,120,150].map((d) => (
          <ellipse key={d} cx={size/2} cy={size/2} rx={size*0.36} ry={size*0.1} transform={`rotate(${d} ${size/2} ${size/2})`} fill="none" stroke="oklch(0.7 0.05 250 / 0.12)" />
        ))}
      </svg>
      {/* Orbiting rings */}
      {rings.map((r, i) => (
        <div key={i} className="absolute inset-0" style={{ animation: `spin-slow ${r.dur}s linear infinite`, animationDirection: i%2 ? "reverse" : "normal" }}>
          <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
            <ellipse cx={size/2} cy={size/2} rx={r.rx} ry={r.ry} fill="none" stroke="url(#ring-stroke)" strokeOpacity="0.6" strokeWidth="1"
              transform={`rotate(${r.rot} ${size/2} ${size/2})`} />
            <circle cx={size/2 + r.rx} cy={size/2} r="4" fill="var(--neon-cyan)" transform={`rotate(${r.rot} ${size/2} ${size/2})`}>
              <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>
      ))}
      {/* Floating animal nodes */}
      {nodes.map((n, i) => (
        <motion.div key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 + i * 0.15, duration: 0.6 }}
          className="absolute flex h-3 w-3 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
          style={{ left: `${n.x*100}%`, top: `${n.y*100}%`, background: n.c, boxShadow: `0 0 16px ${n.c}` }}>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: n.c }} />
        </motion.div>
      ))}
      {/* Core badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-[oklch(0.12_0.02_260/0.8)] px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-[var(--neon-cyan)]">
        Nexus Core · Live
      </motion.div>
    </div>
  );
}