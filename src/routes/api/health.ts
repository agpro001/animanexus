import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        const env = {
          LOVABLE_API_KEY: !!process.env.LOVABLE_API_KEY,
          SUPABASE_URL: !!process.env.SUPABASE_URL,
          SUPABASE_PUBLISHABLE_KEY: !!process.env.SUPABASE_PUBLISHABLE_KEY,
          SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        };
        const aiReady = env.LOVABLE_API_KEY;
        const dbReady = env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY;
        return new Response(
          JSON.stringify({
            ok: aiReady && dbReady,
            aiReady,
            dbReady,
            env,
            ts: Date.now(),
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      },
    },
  },
});