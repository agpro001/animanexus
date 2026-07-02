import { createFileRoute } from "@tanstack/react-router";
import { getUserFromRequest, getOrCreateStripeCustomer, getStripe } from "@/lib/billing.server";

export const Route = createFileRoute("/api/billing/portal")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await getUserFromRequest(request);
        if (!user) return new Response(JSON.stringify({ error: "auth_required" }), {
          status: 401, headers: { "content-type": "application/json" },
        });
        try {
          const stripe = await getStripe();
          const customerId = await getOrCreateStripeCustomer(user.id, user.email);
          const origin =
            request.headers.get("origin") ||
            request.headers.get("referer")?.replace(/\/$/, "") ||
            "https://anima.lovable.app";
          const portal = await stripe.billingPortal.sessions.create({
            customer: customerId, return_url: `${origin}/pricing`,
          });
          return new Response(JSON.stringify({ url: portal.url }), {
            status: 200, headers: { "content-type": "application/json" },
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return new Response(JSON.stringify({ error: "portal_failed", detail: msg }), {
            status: 500, headers: { "content-type": "application/json" },
          });
        }
      },
    },
  },
});