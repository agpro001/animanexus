// In-memory sliding-window rate limiter for server routes.
// Per worker isolate; resilient enough for abuse-prevention without external infra.

type Bucket = { count: number; reset: number };
const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetSeconds: number;
  limit: number;
};

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset <= now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, remaining: limit - 1, resetSeconds: Math.ceil(windowMs / 1000), limit };
  }
  b.count += 1;
  const remaining = Math.max(0, limit - b.count);
  return { ok: b.count <= limit, remaining, resetSeconds: Math.ceil((b.reset - now) / 1000), limit };
}

export function clientIp(request: Request): string {
  const h = request.headers;
  return (
    h.get("cf-connecting-ip") ||
    h.get("x-real-ip") ||
    (h.get("x-forwarded-for") || "").split(",")[0].trim() ||
    "anon"
  );
}

export function rateLimitHeaders(r: RateLimitResult): Record<string, string> {
  return {
    "x-ratelimit-limit": String(r.limit),
    "x-ratelimit-remaining": String(r.remaining),
    "x-ratelimit-reset": String(r.resetSeconds),
  };
}