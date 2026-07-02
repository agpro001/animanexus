import { createFileRoute } from "@tanstack/react-router";
import { getUserFromRequest, getOrCreateStripeCustomer, getStripe, PRICES, type PlanId } from "@/lib/billing.server";

export const Route = createFileRoute("/api/billing/checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await getUserFromRequest(request);
        if (!user) return json(401, { error: "auth_required" });
        let body: { plan?: PlanId } = {};
        try { body = await request.json(); } catch { /* noop */ }
        const plan = (body.plan ?? "monthly") as PlanId;
        if (!(plan in PRICES)) return json(400, { error: "invalid_plan" });
        try {
          const stripe = await getStripe();
          const customerId = await getOrCreateStripeCustomer(user.id, user.email);
          const origin =
            request.headers.get("origin") ||
            request.headers.get("referer")?.replace(/\/$/, "") ||
            "https://anima.lovable.app";
          const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: plan === "monthly" ? "subscription" : "payment",
            line_items: [{ price: PRICES[plan], quantity: 1 }],
            success_url: `${origin}/pricing?status=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/pricing?status=cancel`,
            allow_promotion_codes: true,
            metadata: { supabase_user_id: user.id, plan },
          });
          return json(200, { url: session.url });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error("[checkout] error", msg);
          return json(500, { error: "checkout_failed", detail: msg });
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