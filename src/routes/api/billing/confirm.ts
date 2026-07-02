import { createFileRoute } from "@tanstack/react-router";
import { getUserFromRequest, getStripe, PRICES } from "@/lib/billing.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/billing/confirm")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await getUserFromRequest(request);
        if (!user) return json(401, { error: "auth_required" });
        let body: { session_id?: string } = {};
        try { body = await request.json(); } catch { /* noop */ }
        if (!body.session_id) return json(400, { error: "session_id required" });
        try {
          const stripe = await getStripe();
          const session = await stripe.checkout.sessions.retrieve(body.session_id, {
            expand: ["line_items", "subscription"],
          });
          const owner = (session.metadata?.supabase_user_id ?? "") as string;
          if (owner && owner !== user.id) return json(403, { error: "not_owner" });
          if (session.payment_status !== "paid" && session.status !== "complete")
            return json(200, { ok: false, status: session.status });
          if (session.mode === "subscription") {
            const sub = session.subscription as import("stripe").default.Subscription | string | null;
            let subscription = typeof sub === "string" ? await stripe.subscriptions.retrieve(sub) : sub;
            if (subscription) {
              const item = subscription.items.data[0];
              const end = item?.current_period_end ?? (subscription as unknown as { current_period_end?: number }).current_period_end;
              if (end) {
                await supabaseAdmin.from("ai_entitlements").upsert({
                  user_id: user.id,
                  subscribed_until: new Date(end * 1000).toISOString(),
                }, { onConflict: "user_id" });
              }
            }
          } else if (session.mode === "payment") {
            // Count credits by line items matching our single-use price
            let credits = 0;
            for (const li of session.line_items?.data ?? []) {
              if (li.price?.id === PRICES.single) credits += li.quantity ?? 1;
            }
            if (credits > 0) {
              // Increment credits atomically
              const { data: existing } = await supabaseAdmin
                .from("ai_entitlements").select("paid_credits").eq("user_id", user.id).maybeSingle();
              const nextCredits = (existing?.paid_credits ?? 0) + credits;
              await supabaseAdmin.from("ai_entitlements").upsert({
                user_id: user.id, paid_credits: nextCredits,
              }, { onConflict: "user_id" });
            }
          }
          return json(200, { ok: true });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return json(500, { error: "confirm_failed", detail: msg });
        }
      },
    },
  },
});

function json(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status, headers: { "content-type": "application/json" },
  });
}