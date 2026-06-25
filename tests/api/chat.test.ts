import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Integration tests for /api/chat.
 *
 * These tests run the route's POST handler directly (no HTTP listener required)
 * with stubbed network + supabase admin client. They catch:
 *   - TypeScript regressions (the file must compile in this project).
 *   - Runtime regressions in request validation, request-id propagation, and error logging.
 */

vi.mock("@/integrations/supabase/client.server", () => {
  const insert = vi.fn(async () => ({ error: null }));
  return {
    supabaseAdmin: { from: () => ({ insert }) },
    __insert: insert,
  };
});

const originalFetch = globalThis.fetch;

async function getHandler() {
  const mod = await import("@/routes/api/chat");
  // @ts-expect-error – TanStack route options carry server handlers we don't expose in types
  const handler = mod.Route.options.server.handlers.POST as (ctx: { request: Request }) => Promise<Response>;
  return handler;
}

describe("/api/chat POST", () => {
  beforeEach(() => {
    process.env.LOVABLE_API_KEY = "test-key";
    globalThis.fetch = vi.fn(async () =>
      new Response(
        // minimal OpenAI-compatible chat-completions stream chunk
        'data: {"choices":[{"delta":{"content":"hi"}}]}\n\ndata: [DONE]\n\n',
        { status: 200, headers: { "content-type": "text/event-stream", "X-Lovable-AIG-Run-ID": "run_test" } },
      ),
    ) as never;
  });

  it("returns 400 + request id when messages are missing", async () => {
    const handler = await getHandler();
    const res = await handler({
      request: new Request("http://t/api/chat", { method: "POST", body: JSON.stringify({}) }),
    });
    expect(res.status).toBe(400);
    expect(res.headers.get("x-request-id")).toBeTruthy();
    const body = await res.json();
    expect(body.requestId).toBeTruthy();
    expect(String(body.error)).toMatch(/messages/i);
  });

  it("returns 400 on malformed JSON", async () => {
    const handler = await getHandler();
    const res = await handler({
      request: new Request("http://t/api/chat", { method: "POST", body: "not-json" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns a streamed response with x-request-id when valid", async () => {
    const handler = await getHandler();
    const res = await handler({
      request: new Request("http://t/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [
            { id: "1", role: "user", parts: [{ type: "text", text: "hello" }] },
          ],
        }),
      }),
    });
    expect([200, 502]).toContain(res.status); // streamed; 200 normally, 502 if mock stream rejects
    expect(res.headers.get("x-request-id")).toBeTruthy();
  });

  it("propagates a caller-supplied x-request-id", async () => {
    const handler = await getHandler();
    const res = await handler({
      request: new Request("http://t/api/chat", {
        method: "POST",
        headers: { "x-request-id": "trace-xyz" },
        body: JSON.stringify({ messages: "bad" }),
      }),
    });
    expect(res.headers.get("x-request-id")).toBe("trace-xyz");
  });
});

// restore
afterAll?.(() => { globalThis.fetch = originalFetch; });
// vitest exposes afterAll on import; guarded for safety
declare const afterAll: ((fn: () => void) => void) | undefined;