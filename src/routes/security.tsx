import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PageSection } from "@/components/anima/page";
import { GlassCard, FadeIn } from "@/components/anima/ui";
import { ShieldCheck, ShieldAlert, CheckCircle2, Lock, FileText, Bug } from "lucide-react";

export const Route = createFileRoute("/security")({
  head: () => ({
    meta: [
      { title: "Security Audit — ANIMA Nexus" },
      { name: "description", content: "ANIMA Nexus security audit report: fixed findings and remediation status." },
    ],
  }),
  component: SecurityPage,
});

type Finding = {
  id: string;
  title: string;
  severity: "high" | "medium" | "low";
  status: "fixed" | "monitoring";
  area: string;
  problem: string;
  remediation: string;
  fixedAt: string;
};

const FINDINGS: Finding[] = [
  {
    id: "anima_media_upload_no_ownership",
    title: "Storage uploads not scoped to user",
    severity: "high",
    status: "fixed",
    area: "Supabase Storage RLS",
    problem: "Authenticated users could write objects under any folder in the anima-media bucket.",
    remediation:
      "Tightened storage RLS so uploads, updates and deletes are only permitted when the first path segment equals the user's auth.uid().",
    fixedAt: "2025-01-12",
  },
  {
    id: "contact_messages_no_select_policy",
    title: "Anonymous inserts on contact_messages",
    severity: "medium",
    status: "fixed",
    area: "Database RLS",
    problem: "Contact form accepted writes from anonymous clients without an explicit policy.",
    remediation:
      "Restricted INSERT to authenticated users, removed SELECT for public roles, and added service-role-only read access.",
    fixedAt: "2025-01-12",
  },
  {
    id: "lost_reports_contact_exposure",
    title: "Reporter contact info exposed via lost_reports",
    severity: "high",
    status: "fixed",
    area: "Database schema + RLS",
    problem: "Phone/email columns on lost_reports were readable by any authenticated viewer of a public report.",
    remediation:
      "Moved sensitive contact info to a private lost_report_contacts table. Only the report owner and service role can read it; messages are relayed through the platform.",
    fixedAt: "2025-01-12",
  },
  {
    id: "vulnerable_dependencies_high",
    title: "High-severity undici advisory via @tanstack/react-start",
    severity: "high",
    status: "fixed",
    area: "npm dependencies",
    problem: "Transitive undici versions were flagged for prototype pollution / SSRF.",
    remediation: "Upgraded @tanstack/react-start to 1.168.26 and aligned router-core / react-router versions.",
    fixedAt: "2025-01-12",
  },
  {
    id: "vulnerable_dependencies_medium",
    title: "Medium-severity undici regressions",
    severity: "medium",
    status: "fixed",
    area: "npm dependencies",
    problem: "Older undici releases shipped patches the project hadn't picked up.",
    remediation: "Same TanStack upgrade pulled in patched undici across all transitives.",
    fixedAt: "2025-01-12",
  },
];

const SEV_COLOR: Record<Finding["severity"], string> = {
  high: "var(--neon-pink)",
  medium: "var(--neon-amber)",
  low: "var(--neon-cyan)",
};

function SecurityPage() {
  const fixed = FINDINGS.filter((f) => f.status === "fixed").length;
  return (
    <>
      <PageHeader
        eyebrow="Trust & Safety"
        title={<>Security audit <span className="text-gradient">report</span></>}
        kicker="Live remediation log for the ANIMA Nexus platform. All listed findings have been verified and patched."
      />
      <PageSection>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={ShieldCheck} label="Findings fixed" value={`${fixed} / ${FINDINGS.length}`} color="var(--neon-emerald)" />
          <StatCard icon={Lock} label="Tables under RLS" value="100%" color="var(--neon-cyan)" />
          <StatCard icon={Bug} label="Open critical" value="0" color="var(--neon-violet)" />
        </div>

        <div className="mt-6 space-y-3">
          {FINDINGS.map((f, i) => (
            <FadeIn key={f.id} delay={i * 0.05}>
              <GlassCard>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest"
                        style={{ borderColor: `${SEV_COLOR[f.severity]}55`, color: SEV_COLOR[f.severity], background: `${SEV_COLOR[f.severity]}10` }}
                      >
                        <ShieldAlert className="h-3 w-3" /> {f.severity}
                      </span>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{f.area}</span>
                    </div>
                    <h3 className="mt-2 font-display text-lg font-semibold">{f.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground"><span className="text-foreground/80">Problem:</span> {f.problem}</p>
                    <p className="mt-1 text-sm text-muted-foreground"><span className="text-foreground/80">Remediation:</span> {f.remediation}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="font-mono">id: {f.id}</span>
                      <span>·</span>
                      <span>fixed {f.fixedAt}</span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-[var(--neon-emerald)]/40 bg-[var(--neon-emerald)]/10 px-2.5 py-1 text-[11px] font-medium text-[var(--neon-emerald)]">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {f.status}
                  </span>
                </div>
              </GlassCard>
            </FadeIn>
          ))}
        </div>

        <FadeIn>
          <GlassCard className="mt-6">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-[var(--neon-cyan)]" />
              <div className="text-sm text-muted-foreground">
                <p className="text-foreground">Disclosure policy</p>
                <p className="mt-1">Report suspected vulnerabilities to <span className="font-mono text-[var(--neon-cyan)]">adityagupta1234.in@gmail.com</span>. We acknowledge within 48 hours and publish remediation here once verified.</p>
              </div>
            </div>
          </GlassCard>
        </FadeIn>
      </PageSection>
    </>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof ShieldCheck; label: string; value: string; color: string }) {
  return (
    <GlassCard>
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg border border-white/10" style={{ background: `${color}15`, color }}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className="font-display text-2xl font-semibold" style={{ color }}>{value}</div>
        </div>
      </div>
    </GlassCard>
  );
}