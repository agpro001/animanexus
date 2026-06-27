CREATE TABLE public.chat_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_hash text NOT NULL UNIQUE,
  prompt_preview text NOT NULL,
  response_text text NOT NULL,
  model text NOT NULL,
  hit_count integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.chat_cache TO anon, authenticated;
GRANT ALL ON public.chat_cache TO service_role;

ALTER TABLE public.chat_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_cache public read" ON public.chat_cache FOR SELECT USING (true);

CREATE INDEX chat_cache_hash_idx ON public.chat_cache(prompt_hash);

CREATE TRIGGER chat_cache_touch BEFORE UPDATE ON public.chat_cache
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();