import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, PageSection } from "@/components/anima/page";
import { GlassCard, FadeIn } from "@/components/anima/ui";
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — ANIMA Nexus" }] }),
  component: AdminPage,
});

type Row = { id: string; created_at: string; [k: string]: unknown };

function AdminPage() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<"animals"|"lost"|"wildlife"|"emergency"|"ai">("animals");
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    setBusy(true);
    const table = ({ animals: "animals", lost: "lost_reports", wildlife: "wildlife_alerts", emergency: "emergency_reports", ai: "ai_analyses" })[tab];
    supabase.from(table).select("*").order("created_at", { ascending: false }).limit(50)
      .then(({ data }) => { setRows((data as Row[]) ?? []); setBusy(false); });
  }, [tab, user]);

  if (loading) return null;
  if (!user) return (
    <PageSection>
      <GlassCard className="text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-[var(--neon-pink)]" />
        <h2 className="mt-4 font-display text-xl font-semibold">Admin requires sign-in</h2>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to access platform telemetry.</p>
        <Link to="/auth" className="mt-4 inline-block text-sm text-[var(--neon-cyan)] hover:underline">Sign in →</Link>
      </GlassCard>
    </PageSection>
  );

  return (
    <>
      <PageHeader eyebrow="Mission Control" title={<>ANIMA <span className="text-gradient">Admin Console</span></>}
        kicker="Monitor every twin, report, AI prediction, and emergency across your network." />
      <PageSection>
        <FadeIn>
          <GlassCard>
            <div className="flex flex-wrap gap-1 border-b border-white/10 pb-2">
              {(["animals","lost","wildlife","emergency","ai"] as const).map((k) => (
                <button key={k} onClick={() => setTab(k)} className={`rounded-md px-3 py-1.5 text-xs uppercase tracking-widest ${tab===k ? "bg-[var(--neon-cyan)]/15 text-[var(--neon-cyan)]" : "text-muted-foreground hover:text-foreground"}`}>{k}</button>
              ))}
            </div>
            <div className="mt-3 max-h-[60vh] overflow-auto rounded-md border border-white/10">
              {busy ? <div className="p-6 text-center text-sm text-muted-foreground">Loading…</div> : rows.length === 0 ? <div className="p-6 text-center text-sm text-muted-foreground">No records.</div> : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5">
                    <tr>
                      {Object.keys(rows[0]).slice(0, 6).map((k) => <th key={k} className="px-3 py-2 font-mono uppercase tracking-widest text-muted-foreground">{k}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} className="border-t border-white/5 hover:bg-white/5">
                        {Object.keys(rows[0]).slice(0, 6).map((k) => (
                          <td key={k} className="max-w-[200px] truncate px-3 py-2 font-mono">{String((r as Record<string, unknown>)[k] ?? "—").slice(0, 80)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </GlassCard>
        </FadeIn>
      </PageSection>
    </>
  );
}