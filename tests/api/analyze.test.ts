import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/integrations/supabase/client.server", () => {
  const insert = vi.fn(async () => ({ error: null }));
  return { supabaseAdmin: { from: () => ({ insert }) } };
});

async function getHandler() {
  const mod = await import("@/routes/api/analyze");
  // @ts-expect-error – server handlers are intentionally not in TanStack's public type
  return mod.Route.options.server.handlers.POST as (ctx: { request: Request }) => Promise<Response>;
}

describe("/api/analyze POST", () => {
  beforeEach(() => {
    process.env.LOVABLE_API_KEY = "test-key";
    globalThis.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          choices: [{
            message: {
              content: JSON.stringify({
                risk_label: "low", confidence: 88, summary: "ok",
                observations: ["clear coat"], next_steps: ["monitor"],
              }),
            },
          }],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    ) as never;
  });

  it("rejects invalid JSON body", async () => {
    const handler = await getHandler();
    const res = await handler({
      request: new Request("http://t/api/analyze", { method: "POST", body: "{bad" }),
    });
    expect(res.status).toBe(400);
    const j = await res.json();
    expect(j.error).toBe("invalid_json");
    expect(j.requestId).toBeTruthy();
  });

  it("rejects unknown kind", async () => {
    const handler = await getHandler();
    const res = await handler({
      request: new Request("http://t/api/analyze", {
        method: "POST",
        body: JSON.stringify({ kind: "not_a_real_kind" }),
      }),
    });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_kind");
  });

  it("returns parsed JSON result for a valid kind", async () => {
    const handler = await getHandler();
    const res = await handler({
      request: new Request("http://t/api/analyze", {
        method: "POST",
        body: JSON.stringify({ kind: "health_photo", prompt: "fluffy cat patch" }),
      }),
    });
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.result.risk_label).toBe("low");
    expect(j.requestId).toBeTruthy();
    expect(res.headers.get("x-request-id")).toBe(j.requestId);
  });

  it("forwards upstream AI errors with status + request id", async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response("upstream rate limited", { status: 429 }),
    ) as never;
    const handler = await getHandler();
    const res = await handler({
      request: new Request("http://t/api/analyze", {
        method: "POST",
        body: JSON.stringify({ kind: "symptom", prompt: "lethargy" }),
      }),
    });
    expect(res.status).toBe(429);
    const j = await res.json();
    expect(j.error).toBe("ai_error");
    expect(j.requestId).toBeTruthy();
  });
});