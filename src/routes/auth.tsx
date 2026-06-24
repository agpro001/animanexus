import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/anima/logo";
import { GlassCard, NeonButton } from "@/components/anima/ui";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — ANIMA Nexus" }, { name: "description", content: "Sign in or create your ANIMA Nexus account." }] }),
  component: AuthPage,
});

function AuthPage() {
  const { user, signIn, signUp, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!loading && user) navigate({ to: "/twin" }); }, [user, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = mode === "in" ? await signIn(email, password) : await signUp(email, password, name);
      if (r.error) toast.error(r.error.message);
      else if (mode === "up") toast.success("Account created — welcome to ANIMA Nexus");
    } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md items-center px-6 py-16">
      <GlassCard glow="cyan" className="w-full">
        <div className="flex items-center gap-2"><Logo className="h-7 w-7" /><div className="font-display text-lg font-semibold"><span className="text-gradient">ANIMA</span> Nexus</div></div>
        <h1 className="mt-6 font-display text-2xl font-semibold">{mode === "in" ? "Welcome back, guardian" : "Become a guardian"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{mode === "in" ? "Sign in to access your digital twins and AI history." : "Create an account and protect your first animal in seconds."}</p>
        <form onSubmit={submit} className="mt-6 space-y-3">
          {mode === "up" && (
            <Input label="Display name" value={name} onChange={setName} placeholder="Jordan" />
          )}
          <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" required />
          <Input label="Password" type="password" value={password} onChange={setPassword} placeholder="•••••••• (6+ chars)" required minLength={6} />
          <NeonButton type="submit" disabled={busy} className="mt-2 w-full">
            {busy ? "Working…" : mode === "in" ? "Sign in" : "Create account"} <ArrowRight className="h-4 w-4" />
          </NeonButton>
        </form>
        <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-5 w-full text-center text-sm text-muted-foreground hover:text-foreground">
          {mode === "in" ? "New here? Create an account →" : "Already have an account? Sign in →"}
        </button>
        <div className="mt-6 text-center"><Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← Back to home</Link></div>
      </GlassCard>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", placeholder, required, minLength }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean; minLength?: number }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} minLength={minLength}
        className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-[var(--neon-cyan)]/50" />
    </label>
  );
}