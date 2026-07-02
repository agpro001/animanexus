import { supabase } from "@/integrations/supabase/client";

export type EntitlementStatus = {
  authenticated: boolean;
  free_remaining?: number;
  paid_credits?: number;
  subscribed?: boolean;
  subscribed_until?: string | null;
};

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchStatus(): Promise<EntitlementStatus> {
  const r = await fetch("/api/billing/status", { headers: await authHeader() });
  if (!r.ok) return { authenticated: false };
  return (await r.json()) as EntitlementStatus;
}

export async function startCheckout(plan: "single" | "monthly") {
  const r = await fetch("/api/billing/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: JSON.stringify({ plan }),
  });
  const j = (await r.json()) as { url?: string; error?: string };
  if (!r.ok || !j.url) throw new Error(j.error || `checkout_failed_${r.status}`);
  window.location.href = j.url;
}

export async function openPortal() {
  const r = await fetch("/api/billing/portal", {
    method: "POST",
    headers: await authHeader(),
  });
  const j = (await r.json()) as { url?: string; error?: string };
  if (!r.ok || !j.url) throw new Error(j.error || `portal_failed_${r.status}`);
  window.location.href = j.url;
}

export async function confirmSession(sessionId: string) {
  const r = await fetch("/api/billing/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: JSON.stringify({ session_id: sessionId }),
  });
  return (await r.json()) as { ok?: boolean; error?: string };
}