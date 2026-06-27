import { withSupabase } from "@supabase/server";
import type { Database } from "@/integrations/supabase/types";

/**
 * Validates user JWT and provides RLS-scoped Supabase client
 * Use this for protected API routes that require authentication
 */
export function withSupabaseAuth(
  handler: (req: Request, ctx: any) => Promise<Response> | Response
) {
  return withSupabase(
    { auth: "user" },
    async (req, ctx) => {
      try {
        return await handler(req, ctx);
      } catch (error) {
        console.error("[supabase-server] Auth error:", error);
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        });
      }
    }
  );
}

/**
 * Uses service role key - bypasses RLS
 * Only use for server-to-server operations or admin functions
 */
export function withSupabaseAdmin(
  handler: (req: Request, ctx: any) => Promise<Response> | Response
) {
  return withSupabase(
    { auth: "secret" },
    async (req, ctx) => {
      try {
        return await handler(req, ctx);
      } catch (error) {
        console.error("[supabase-server] Admin error:", error);
        return new Response(JSON.stringify({ error: "Server error" }), {
          status: 500,
          headers: { "content-type": "application/json" },
        });
      }
    }
  );
}

/**
 * No auth required - public access
 * Use for public data or endpoints that don't need authentication
 */
export function withSupabasePublic(
  handler: (req: Request, ctx: any) => Promise<Response> | Response
) {
  return withSupabase(
    { auth: "none" },
    async (req, ctx) => {
      try {
        return await handler(req, ctx);
      } catch (error) {
        console.error("[supabase-server] Public route error:", error);
        return new Response(JSON.stringify({ error: "Server error" }), {
          status: 500,
          headers: { "content-type": "application/json" },
        });
      }
    }
  );
}
