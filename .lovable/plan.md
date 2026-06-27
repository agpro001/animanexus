## What I'll ship

### 1. Chat response cache (saves AI credits)

- Add a `chat_cache` table in Lovable Cloud: `prompt_hash` (sha256 of normalized last user message + system version), `response_text`, `model`, `created_at`, `hit_count`. Public read, service-role write.
- In `/api/chat`: before calling the model, hash the last user message. If a row exists, stream the cached text back as a valid AI SDK UI message stream (chunked) and increment `hit_count`. If not, run the model as today and persist the final assembled assistant text on stream finish (`onFinish`).
- Only single-turn lookups are cached (last user message + empty/seed history) to avoid leaking unrelated context. Multi-turn conversations still hit the model.
- Result: identical questions = instant + zero credits; different questions = normal AI path.

### 2. Vercel preview: AI not working

Root cause: `LOVABLE_API_KEY` is a Lovable-managed secret that only exists in the Lovable runtime. Vercel deployments don't get it, so `/api/chat` and `/api/analyze` 500 with "AI gateway not configured".

- Document and surface the fix in the chatbot/analyze error banners ("AI key not set on this host").
- Add `LOVABLE_API_KEY` (and `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` substitutes already public) handling: read `process.env.LOVABLE_API_KEY` and if missing fall back to `process.env.VITE_LOVABLE_API_KEY` won't work (client-only). Instead: instruct user to add `LOVABLE_API_KEY` in Vercel Project Settings → Environment Variables. I'll add a one-screen `/deploy-help` doc page with copy-paste env var list and a check endpoint `/api/health` that reports which envs are present (no values shown) so you can verify on Vercel preview.
- No code change can mint the key on Vercel — it's a workspace-scoped secret. The health page + clear error makes it a 30-second fix on the Vercel side.

### 3. Wildlife heatmap: swap Windy embed

- In `src/routes/wildlife.tsx`, remove the current Windy iframe and drop in the exact iframe URL you provided (wind overlay, ECMWF, surface). Make it responsive (width 100%, keep aspect ratio), keep the existing alerts/event grid around it.

### 4. 5-second branded loader on first load

- New `src/components/anima/app-loader.tsx` adapting your HTML/CSS: liquid-fill AnimaNexus wordmark, animated grid, glow blobs, floating particles, % counter.
- Mounted in `__root.tsx`. Shows for `max(5s, until app ready)`, then fades out. Uses `sessionStorage` flag so it only plays once per tab session (not on every client-side navigation).

### 5. Smoother 3D animations

- `feature-cube.tsx`: switch tilt to spring physics (`useSpring` on rotateX/Y), add subtle parallax inner-layer depth on the icon + title, longer ease-out on hover lift, GPU-friendly `will-change: transform`.
- Chatbot open/close, nav menu, and demo timeline: bump to spring transitions with consistent damping for a unified feel.

### 6. Other error sweep

- Run typecheck + the 8 vitest integration tests after changes.
- Check chatbot rate-limit/credits error banners still render with the new cache path.
- Verify no `process.env` reads leak to client bundles.

## Files touched

- `supabase/migrations/<ts>_chat_cache.sql` (new table + grants + RLS)
- `src/routes/api/chat.ts` (cache lookup + persist on finish)
- `src/routes/api/health.ts` (new; env presence only)
- `src/routes/wildlife.tsx` (new Windy iframe)
- `src/components/anima/app-loader.tsx` (new)
- `src/routes/__root.tsx` (mount loader)
- `src/components/anima/feature-cube.tsx` (spring 3D)
- `src/components/anima/chatbot.tsx` (clearer "AI not configured" error)
- `src/routes/deploy-help.tsx` (new; Vercel env setup walkthrough)

## Out of scope (per "no other changes")

- No redesign of existing modules
- No new AI features beyond the cache
- No auth/roles changes

Make sign in or login button 3d attractive with live animations when clicked live animations popup.

Add parralax animation effect in homepage and motion graphics animations in texts and buttons. All 3d realistic motion graphics animations smooth 3d.

Everything must be working properly correctly and Really.