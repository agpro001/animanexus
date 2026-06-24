# ANIMA Nexus — Implementation Plan

A premium dark-futuristic AI animal protection platform. All 15 modules built, with real AI calls for chatbot, photo health analysis, lost-pet image matching, and audio/bark analysis. Lovable Cloud for auth + data. Single-role login save user data in backend so user can again login and check their old datas.

## Tech foundations

- **Stack**: TanStack Start (current template), Tailwind v4 dark theme, shadcn/ui, framer-motion for smooth motion, three.js + @react-three/fiber + drei for hero globe / 3D twin scene, recharts for dashboards, maplibre-gl for maps.
- **Backend**: Lovable Cloud (auth, Postgres, Storage for media uploads). Use index.html also.
- **AI**: Lovable AI Gateway via AI SDK — `google/gemini-3-flash-preview` for chat + multimodal (image, audio) analysis; `google/gemini-embedding-2` for lost-pet image similarity matching.

## Design system

- Base `#05070d` near-black, panels `oklch` translucent with backdrop-blur glass.
- Neon accents: cyan `#22d3ee`, violet `#a855f7`, emerald `#34d399`, danger `#f43f5e`.
- Gradient borders, soft glow shadows via `box-shadow` tokens.
- Typography: Space Grotesk (headings) + Inter (body) + JetBrains Mono (data).
- All tokens in `src/styles.css`; semantic Tailwind utilities only.

## Routes (TanStack file-based)

```
__root        Shell, sticky glass nav, footer, chatbot dock, AuthProvider
index         Hero (3D globe) + module overview + live preview tabs + CTA
about         Mission, team, research notes
how-it-works  4 workflow diagrams animated on scroll
twin          Digital Twin module — list + detail with 3D twin viewer
twin.$id      Animal detail with status rings, timeline, AI summary
health        Photo/symptom upload → AI risk analysis
lost          Lost pet recovery — report form, map, match results
shelter       Shelter intake + adopter form + compatibility ranking
wildlife      Conservation command center with map heatmaps
audio         Bark/meow/bird audio upload → AI emotion estimate
emergency     One-tap distress flow + action plan
analytics     Impact dashboard (charts, counters)
demo          Guided demo mode (preloaded story)
faq           Accordion FAQ
contact       Form → stored in DB
admin         Admin dashboard (single-role: any logged-in user for v1)
auth          Login/signup
api/chat      Streaming chat endpoint (AI SDK)
api/analyze-photo, api/analyze-audio, api/match-lost  Server routes for AI
```

## Database (Lovable Cloud)

Tables with RLS scoped to `auth.uid()` where applicable, plus public-read for shelter/lost feeds:

- `profiles` (user metadata)
- `animals` (digital twins: species, traits, status, owner_id, image_url)
- `animal_events` (timeline: health, location, notes)
- `ai_analyses` (type, input_ref, result_json, confidence)
- `lost_reports` (animal_id, last_seen geo, status, embedding vector)
- `sightings` (lost_report_id, photo_url, geo, verified)
- `shelter_animals` (traits, energy, needs)
- `adopter_profiles` (lifestyle, preferences)
- `adoption_matches` (computed scores)
- `wildlife_zones` + `habitat_alerts` (seeded + user-reported)
- `emergency_reports`
- `notifications`
- `contact_messages`

Each new public-schema table gets explicit `GRANT` block.

## Real working features


| Feature               | How it works                                                                                                                                                                                                                             |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth**              | Email/password via Lovable Cloud, `onAuthStateChange`, protected routes under `_authenticated/`.                                                                                                                                         |
| **Chatbot dock**      | Floating button → drawer chat. AI Elements (Conversation, Message, PromptInput). Streams from `/api/chat`, system prompt scoped to ANIMA Nexus + animal welfare guidance.                                                                |
| **Digital Twin**      | CRUD animal profiles with image upload → storage bucket. AI generates initial summary, risk score, suggested actions on create. Timeline appends events.                                                                                 |
| **Health AI**         | Upload photo + symptoms → `streamText` with image content block → returns risk label, confidence, next steps; saved to `ai_analyses`.                                                                                                    |
| **Lost pet matching** | Report submission → store + compute embedding via `/v1/embeddings` (gemini-embedding-2 multimodal). Match against sightings/animals by cosine similarity (computed in SQL with pgvector or in handler). Map with maplibre + heat radius. |
| **Shelter matching**  | Adopter form scored against shelter animals via rule-based + AI explanation. Ranked list with fit bars.                                                                                                                                  |
| **Wildlife**          | Seeded zones + map heatmap; user can submit reports; AI classifies threat level.                                                                                                                                                         |
| **Audio analysis**    | Upload audio → AI multimodal call → emotion ring + interpretation + waveform (wavesurfer.js).                                                                                                                                            |
| **Emergency**         | Big red button → classify scenario → action plan with countdown; saves report; suggests nearby resources (seeded).                                                                                                                       |
| **Analytics**         | Aggregates real DB counts + recharts visualizations.                                                                                                                                                                                     |
| **Admin**             | Tabs for users, reports, AI history, emergencies.                                                                                                                                                                                        |
| **Demo mode**         | One button seeds a story animal and walks through twin → health → lost → emergency with animated reveals.                                                                                                                                |


## 3D / motion

- **Hero**: react-three-fiber globe with orbiting animal nodes, glowing connection lines, drei `Stars`, auto-rotate, scroll-coupled tilt.
- **Twin viewer**: 3D pseudo-anatomical sphere with clickable signal nodes (health/stress/location overlays).
- **Cards**: framer-motion hover tilt, layered glass, animated counters, pulsing live indicators, signal-wave SVGs.
- **Page transitions**: AnimatePresence fades + subtle Y translate; respects `prefers-reduced-motion`.

## Mobile

- Collapsible glass menu, stacked cards, simplified globe (lower poly + disabled auto-rotate), touch-tuned chatbot dock.

## Build order

1. Enable Lovable Cloud, provision LOVABLE_API_KEY, install deps (three, @react-three/fiber, drei, framer-motion, maplibre-gl, wavesurfer.js, recharts, ai, @ai-sdk/react, @ai-sdk/openai-compatible, AI Elements).
2. Design tokens in `styles.css`, fonts via @fontsource, shell + nav + footer in `__root`.
3. Auth (signup/login, protected layout, profile bootstrap).
4. DB migrations for all tables with RLS + GRANTs.
5. Hero with 3D globe + landing module overview + live preview tabs.
6. Digital Twin module (CRUD + 3D viewer + AI summary).
7. Health AI page (photo + symptom analysis).
8. Lost pet recovery (map, report, embedding match).
9. Shelter matching, Wildlife, Audio, Emergency modules.
10. Analytics, Admin, Demo mode, FAQ, Contact, About, How It Works.
11. Chatbot dock (global) wired to streaming `/api/chat`.
12. Polish: motion, mobile, loading/empty/error states, SEO per route, `public/llms.txt`.

## Notes / trade-offs

- "All modules real" is large; I'll ship each module functional but with seeded baseline data so the demo feels alive. Wildlife sensor feeds and ranger notifications use realistic seeded data (no external IoT).
- Single-role auth: every signed-in user can access admin in v1 per your choice. Easy to lock down later by adding a `user_roles` table.
- Embeddings stored as `vector` column (enable pgvector extension); similarity via SQL.
- AI calls cost credits per request — surface 429/402 errors clearly.

&nbsp;

Everything must working properly correctly and Really.