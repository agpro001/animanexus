import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const PRICES = {
  single: "price_1TomNsEBYzPIOfbmLFnPcjjq", // $0.50 one-time
  monthly: "price_1TomNxEBYzPIOfbmxJ9z3mxs", // $4/mo subscription
} as const;

export type PlanId = keyof typeof PRICES;

export type AuthedUser = { id: string; email: string | null };

export async function getUserFromRequest(req: Request): Promise<AuthedUser | null> {
  const auth = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!auth || !auth.toLowerCase().startsWith("bearer ")) return null;
  const token = auth.slice(7).trim();
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? null };
}

export type ConsumeResult = {
  ok: boolean;
  reason: "free" | "credit" | "subscription" | "paywall";
  free_remaining: number;
  paid_credits: number;
  subscribed_until: string | null;
};

export async function consumeCredit(userId: string): Promise<ConsumeResult> {
  const { data, error } = await supabaseAdmin.rpc("consume_ai_credit", { _user_id: userId });
  if (error) throw new Error(`consume_ai_credit failed: ${error.message}`);
  return data as unknown as ConsumeResult;
}

export async function getEntitlement(userId: string) {
  const { data } = await supabaseAdmin
    .from("ai_entitlements")
    .select("free_used,paid_credits,subscribed_until,stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();
  const free_used = data?.free_used ?? 0;
  return {
    free_remaining: Math.max(3 - free_used, 0),
    paid_credits: data?.paid_credits ?? 0,
    subscribed_until: data?.subscribed_until ?? null,
    subscribed:
      data?.subscribed_until != null && new Date(data.subscribed_until).getTime() > Date.now(),
    stripe_customer_id: data?.stripe_customer_id ?? null,
  };
}

export function paywallResponse(requestId: string, status: number, reason: string) {
  return new Response(
    JSON.stringify({
      error: reason,
      requestId,
      paywall: { plans: { single: "$0.50 / use", monthly: "$4 / month unlimited" } },
    }),
    {
      status,
      headers: { "content-type": "application/json", "x-request-id": requestId },
    },
  );
}

let _stripe: import("stripe").default | null = null;
export async function getStripe() {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
  const Stripe = (await import("stripe")).default;
  _stripe = new Stripe(key, { apiVersion: "2025-08-27.basil" as never });
  return _stripe;
}

export async function getOrCreateStripeCustomer(userId: string, email: string | null) {
  const stripe = await getStripe();
  const ent = await getEntitlement(userId);
  if (ent.stripe_customer_id) return ent.stripe_customer_id;
  let customerId: string | null = null;
  if (email) {
    const found = await stripe.customers.list({ email, limit: 1 });
    if (found.data.length) customerId = found.data[0].id;
  }
  if (!customerId) {
    const created = await stripe.customers.create({
      email: email ?? undefined,
      metadata: { supabase_user_id: userId },
    });
    customerId = created.id;
  }
  await supabaseAdmin
    .from("ai_entitlements")
    .upsert({ user_id: userId, stripe_customer_id: customerId }, { onConflict: "user_id" });
  return customerId;
}