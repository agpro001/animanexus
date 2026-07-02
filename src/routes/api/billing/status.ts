import { createFileRoute } from "@tanstack/react-router";
import { getUserFromRequest, getEntitlement, getStripe, getOrCreateStripeCustomer } from "@/lib/billing.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/billing/status")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await getUserFromRequest(request);
        if (!user) return new Response(JSON.stringify({ authenticated: false }), {
          status: 200, headers: { "content-type": "application/json" },
        });
        // Refresh subscription from Stripe (source of truth)
        try {
          const stripe = await getStripe();
          const customerId = await getOrCreateStripeCustomer(user.id, user.email);
          const subs = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 });
          let subscribed_until: string | null = null;
          if (subs.data.length) {
            const item = subs.data[0].items.data[0];
            const end = item?.current_period_end ?? (subs.data[0] as unknown as { current_period_end?: number }).current_period_end;
            if (end) subscribed_until = new Date(end * 1000).toISOString();
          }
          await supabaseAdmin
            .from("ai_entitlements")
            .upsert({ user_id: user.id, subscribed_until }, { onConflict: "user_id" });
        } catch (e) {
          console.warn("[status] stripe sync failed", (e as Error).message);
        }
        const ent = await getEntitlement(user.id);
        return new Response(JSON.stringify({ authenticated: true, ...ent }), {
          status: 200, headers: { "content-type": "application/json" },
        });
      },
    },
  },
});