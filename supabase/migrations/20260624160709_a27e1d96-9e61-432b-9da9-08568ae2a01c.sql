
-- updated_at helper
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$ LANGUAGE plpgsql SET search_path = public;

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles self read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles self upsert" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)));
  RETURN NEW;
END $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- animals (digital twins)
CREATE TABLE public.animals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  species TEXT NOT NULL,
  breed TEXT,
  age_years NUMERIC,
  gender TEXT,
  weight_kg NUMERIC,
  color TEXT,
  location TEXT,
  image_url TEXT,
  health_status TEXT DEFAULT 'healthy',
  risk_level TEXT DEFAULT 'low',
  stress_score INT DEFAULT 20,
  activity_score INT DEFAULT 70,
  ai_summary TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.animals TO authenticated;
GRANT ALL ON public.animals TO service_role;
ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "animals owner all" ON public.animals FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE TRIGGER trg_animals_updated BEFORE UPDATE ON public.animals FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- animal events (timeline)
CREATE TABLE public.animal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID NOT NULL REFERENCES public.animals ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  detail TEXT,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.animal_events TO authenticated;
GRANT ALL ON public.animal_events TO service_role;
ALTER TABLE public.animal_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events owner all" ON public.animal_events FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- AI analyses
CREATE TABLE public.ai_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  animal_id UUID REFERENCES public.animals ON DELETE SET NULL,
  kind TEXT NOT NULL, -- 'health_photo' | 'audio' | 'symptom' | 'twin_summary'
  input_meta JSONB DEFAULT '{}'::jsonb,
  result JSONB NOT NULL,
  confidence NUMERIC,
  risk_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_analyses TO authenticated;
GRANT ALL ON public.ai_analyses TO service_role;
ALTER TABLE public.ai_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "analyses owner all" ON public.ai_analyses FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- lost reports (public-readable so community can help)
CREATE TABLE public.lost_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  species TEXT NOT NULL,
  breed TEXT,
  color TEXT,
  size TEXT,
  collar TEXT,
  temperament TEXT,
  last_seen_address TEXT,
  last_seen_lat NUMERIC,
  last_seen_lng NUMERIC,
  last_seen_at TIMESTAMPTZ,
  photo_url TEXT,
  contact TEXT,
  status TEXT DEFAULT 'searching',
  ai_tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lost_reports TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lost_reports TO authenticated;
GRANT ALL ON public.lost_reports TO service_role;
ALTER TABLE public.lost_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lost public read" ON public.lost_reports FOR SELECT USING (true);
CREATE POLICY "lost owner write" ON public.lost_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "lost owner update" ON public.lost_reports FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "lost owner delete" ON public.lost_reports FOR DELETE TO authenticated USING (auth.uid() = owner_id);
CREATE TRIGGER trg_lost_updated BEFORE UPDATE ON public.lost_reports FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- sightings (community submissions)
CREATE TABLE public.sightings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lost_report_id UUID REFERENCES public.lost_reports ON DELETE CASCADE,
  reporter_id UUID REFERENCES auth.users ON DELETE SET NULL,
  description TEXT,
  lat NUMERIC,
  lng NUMERIC,
  photo_url TEXT,
  match_confidence NUMERIC,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sightings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sightings TO authenticated;
GRANT ALL ON public.sightings TO service_role;
ALTER TABLE public.sightings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sight public read" ON public.sightings FOR SELECT USING (true);
CREATE POLICY "sight auth insert" ON public.sightings FOR INSERT TO authenticated WITH CHECK (true);

-- shelter animals
CREATE TABLE public.shelter_animals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  shelter_name TEXT,
  name TEXT NOT NULL,
  species TEXT NOT NULL,
  age_years NUMERIC,
  energy INT DEFAULT 5,
  friendliness INT DEFAULT 5,
  good_with_kids BOOLEAN DEFAULT TRUE,
  good_with_pets BOOLEAN DEFAULT TRUE,
  needs_yard BOOLEAN DEFAULT FALSE,
  special_needs TEXT,
  photo_url TEXT,
  description TEXT,
  status TEXT DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.shelter_animals TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shelter_animals TO authenticated;
GRANT ALL ON public.shelter_animals TO service_role;
ALTER TABLE public.shelter_animals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shelter public read" ON public.shelter_animals FOR SELECT USING (true);
CREATE POLICY "shelter owner write" ON public.shelter_animals FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- wildlife alerts
CREATE TABLE public.wildlife_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES auth.users ON DELETE SET NULL,
  zone_name TEXT NOT NULL,
  threat TEXT NOT NULL, -- 'poaching','fire','drought','flood','injury'
  severity INT DEFAULT 3,
  lat NUMERIC,
  lng NUMERIC,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wildlife_alerts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wildlife_alerts TO authenticated;
GRANT ALL ON public.wildlife_alerts TO service_role;
ALTER TABLE public.wildlife_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wild public read" ON public.wildlife_alerts FOR SELECT USING (true);
CREATE POLICY "wild auth insert" ON public.wildlife_alerts FOR INSERT TO authenticated WITH CHECK (true);

-- emergency reports
CREATE TABLE public.emergency_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  animal_id UUID REFERENCES public.animals ON DELETE SET NULL,
  scenario TEXT NOT NULL,
  severity TEXT DEFAULT 'high',
  location TEXT,
  notes TEXT,
  action_plan JSONB,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emergency_reports TO authenticated;
GRANT ALL ON public.emergency_reports TO service_role;
ALTER TABLE public.emergency_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "emerg owner all" ON public.emergency_reports FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- contact messages
CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contact insert anyone" ON public.contact_messages FOR INSERT WITH CHECK (true);
