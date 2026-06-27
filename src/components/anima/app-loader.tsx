import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const MIN_MS = 5000;
const SESSION_KEY = "anima_loaded_v1";

export function AppLoader() {
  const [visible, setVisible] = useState(true);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY)) {
      setVisible(false);
      return;
    }
    const start = Date.now();
    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      setPct(Math.min(100, Math.round((elapsed / MIN_MS) * 100)));
      if (elapsed >= MIN_MS) {
        clearInterval(tick);
        sessionStorage.setItem(SESSION_KEY, "1");
        setVisible(false);
      }
    }, 60);
    return () => clearInterval(tick);
  }, []);

  // Particles (deterministic-ish)
  const particles = Array.from({ length: 36 }, (_, i) => ({
    left: (i * 37) % 100,
    delay: (i % 7) * 0.6,
    dur: 4 + ((i * 13) % 50) / 10,
  }));

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="anima-loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] grid place-items-center overflow-hidden"
          style={{
            background:
              "radial-gradient(circle at top left, oklch(0.78 0.18 200 / 0.18), transparent 35%), radial-gradient(circle at bottom right, oklch(0.62 0.22 290 / 0.18), transparent 35%), linear-gradient(135deg, oklch(0.05 0.02 260), oklch(0.08 0.04 270) 45%, oklch(0.04 0.02 260))",
            perspective: 1400,
          }}
        >
          {/* glow blobs */}
          <span className="pointer-events-none absolute -left-32 -top-32 h-[360px] w-[360px] rounded-full opacity-60" style={{ background: "var(--neon-cyan)", filter: "blur(90px)" }} />
          <span className="pointer-events-none absolute -right-24 -bottom-24 h-[320px] w-[320px] rounded-full opacity-60" style={{ background: "var(--neon-violet)", filter: "blur(90px)" }} />

          <motion.div
            animate={{ rotateX: [2, -2, 2], rotateY: [-3, 3, -3] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformStyle: "preserve-3d" }}
            className="relative h-[min(72vh,340px)] w-[min(92vw,920px)] overflow-hidden rounded-[42px] border border-white/10"
          >
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(145deg, oklch(0.14 0.04 270 / 0.92), oklch(0.06 0.03 270 / 0.96))",
                boxShadow:
                  "0 0 45px oklch(0.78 0.18 200 / 0.18), 0 0 80px oklch(0.62 0.22 290 / 0.1), inset 0 0 40px oklch(0.78 0.18 200 / 0.06)",
              }}
            />
            {/* grid */}
            <div
              className="absolute inset-0 opacity-55"
              style={{
                backgroundImage:
                  "linear-gradient(oklch(0.78 0.18 200 / 0.08) 1px, transparent 1px), linear-gradient(90deg, oklch(0.78 0.18 200 / 0.08) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
                maskImage: "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
                WebkitMaskImage: "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
              }}
            />

            {/* Title — outline + animated gradient liquid fill */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none font-display font-black leading-none tracking-tight"
              style={{
                fontSize: "clamp(54px, 9vw, 120px)",
                color: "oklch(0.18 0.04 260)",
                filter: "drop-shadow(0 0 30px oklch(0.78 0.18 200 / 0.25)) drop-shadow(0 0 70px oklch(0.62 0.22 290 / 0.18))",
              }}
            >
              AnimaNexus
              <motion.span
                aria-hidden
                className="absolute inset-0 bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(to bottom, #ffffff, #c6ebff 40%, #79d5ff 65%, #8c63ff 100%)",
                }}
                initial={{ clipPath: "inset(100% 0 0 0)" }}
                animate={{ clipPath: "inset(0% 0 0 0)" }}
                transition={{ duration: MIN_MS / 1000, ease: "easeInOut" }}
              >
                AnimaNexus
              </motion.span>
            </div>

            {/* shine */}
            <motion.div
              className="pointer-events-none absolute top-[-50%] h-[220%] w-[140px]"
              style={{
                background: "linear-gradient(to right, transparent, rgba(255,255,255,0.45), transparent)",
                transform: "rotate(18deg)",
                filter: "blur(12px)",
              }}
              initial={{ left: "-30%" }}
              animate={{ left: "130%" }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            />

            <div className="absolute bottom-6 right-8 font-mono text-xs tracking-[0.25em] text-[var(--neon-cyan)]/85">
              {pct.toString().padStart(2, "0")}%
            </div>
          </motion.div>

          {/* floating particles */}
          {particles.map((p, i) => (
            <motion.span
              key={i}
              className="pointer-events-none absolute bottom-0 h-1 w-1 rounded-full"
              style={{
                left: `${p.left}%`,
                background: "#79d5ff",
                boxShadow: "0 0 12px #79d5ff",
                filter: "blur(1px)",
              }}
              initial={{ y: 0, opacity: 0 }}
              animate={{ y: -260, opacity: [0, 1, 0] }}
              transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: "linear" }}
            />
          ))}

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[11px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
            Calibrating digital guardians…
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}