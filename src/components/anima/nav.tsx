import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, LogOut, User as UserIcon, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { Logo } from "./logo";

const PRIMARY = [
  { to: "/", label: "Home" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/twin", label: "Digital Twin" },
  { to: "/health", label: "Health AI" },
  { to: "/lost", label: "Lost Pets" },
  { to: "/shelter", label: "Shelter" },
  { to: "/wildlife", label: "Wildlife" },
  { to: "/audio", label: "Audio" },
  { to: "/emergency", label: "Emergency" },
  { to: "/analytics", label: "Analytics" },
] as const;

export function Nav() {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[oklch(0.12_0.025_260/0.7)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight">
          <Logo className="h-7 w-7" />
          <span><span className="text-gradient">ANIMA</span> Nexus</span>
        </Link>
        <nav className="ml-6 hidden flex-1 items-center gap-1 overflow-x-auto xl:flex">
          {PRIMARY.map((l) => {
            const active = pathname === l.to || (l.to !== "/" && pathname.startsWith(l.to));
            return (
              <Link key={l.to} to={l.to as never}
                className={`whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm transition ${
                  active ? "text-[var(--neon-cyan)]" : "text-muted-foreground hover:text-foreground"
                }`}>
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto hidden items-center gap-2 xl:flex">
          {user ? (
            <>
              <Link to="/admin" className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">Admin</Link>
              <button onClick={signOut} className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10">
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </>
          ) : (
            <SignInButton3D />
          )}
        </div>
        <button onClick={() => setOpen((o) => !o)} className="ml-auto rounded-md border border-white/10 bg-white/5 p-2 xl:hidden">
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>
      {open && (
        <div className="xl:hidden">
          <nav className="mx-auto grid max-w-7xl gap-1 border-t border-white/5 px-4 py-3 text-sm">
            {[
              { to: "/", label: "Home" },
              { to: "/demo", label: "Demo" },
              { to: "/emergency", label: "Emergency" },
              { to: "/contact", label: "Contact" },
            ].map((l) => (
              <Link key={l.to} to={l.to as never} onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-muted-foreground hover:bg-white/5 hover:text-foreground">{l.label}</Link>
            ))}
            {user ? (
              <>
                <Link to="/admin" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-muted-foreground hover:bg-white/5">Admin</Link>
                <button onClick={() => { signOut(); setOpen(false); }} className="rounded-md px-3 py-2 text-left text-muted-foreground hover:bg-white/5">Sign out</button>
              </>
            ) : (
              <Link to="/auth" onClick={() => setOpen(false)} className="rounded-md bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-violet)] px-3 py-2 font-medium text-[oklch(0.13_0.03_260)]">Sign in</Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-white/5 bg-[oklch(0.1_0.02_260/0.6)] backdrop-blur-xl">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-display text-base font-semibold">
            <Logo className="h-6 w-6" /> <span><span className="text-gradient">ANIMA</span> Nexus</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            The AI digital guardian for every animal. Built to protect, predict, and respond.
          </p>
        </div>
        <FooterCol title="Platform" links={[["Digital Twin","/twin"],["Health AI","/health"],["Lost Pets","/lost"],["Shelter","/shelter"],["Wildlife","/wildlife"]]} />
        <FooterCol title="Company" links={[["About","/about"],["How It Works","/how-it-works"],["FAQ","/faq"],["Contact","/contact"],["Security","/security"]]} />
        <FooterCol title="Try" links={[["Live Demo","/demo"],["Analytics","/analytics"],["Emergency","/emergency"],["Audio","/audio"]]} />
      </div>
      <div className="border-t border-white/5 px-6 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} ANIMA Nexus · A digital guardian for every animal
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="font-display text-sm font-semibold text-foreground">{title}</h4>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {links.map(([label, to]) => (
          <li key={to}><Link to={to as never} className="hover:text-foreground">{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}

function SignInButton3D() {
  return (
    <motion.div
      whileHover={{ scale: 1.06, rotateX: -8, rotateY: 6 }}
      whileTap={{ scale: 0.94, rotateX: 4 }}
      transition={{ type: "spring", stiffness: 300, damping: 18 }}
      style={{ perspective: 600, transformStyle: "preserve-3d" }}
      className="relative"
    >
      <span
        className="pointer-events-none absolute -inset-1 rounded-lg opacity-60 blur-md"
        style={{ background: "linear-gradient(90deg,var(--neon-cyan),var(--neon-violet))" }}
      />
      <Link
        to="/auth"
        className="relative inline-flex items-center gap-1.5 overflow-hidden rounded-md bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-violet)] px-4 py-1.5 text-sm font-semibold text-[oklch(0.13_0.03_260)] shadow-[0_8px_24px_-6px_var(--neon-cyan)]"
      >
        <motion.span
          aria-hidden
          className="absolute inset-y-0 -left-1/2 w-1/3"
          style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent)" }}
          animate={{ left: ["-30%", "130%"] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <Sparkles className="h-3.5 w-3.5" />
        <UserIcon className="h-3.5 w-3.5" />
        Sign in
      </Link>
    </motion.div>
  );
}