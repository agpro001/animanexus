-- 1. Private contacts table for lost reports
CREATE TABLE IF NOT EXISTS public.lost_report_contacts (
  lost_report_id uuid PRIMARY KEY REFERENCES public.lost_reports(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  contact text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lost_report_contacts TO authenticated;
GRANT ALL ON public.lost_report_contacts TO service_role;
ALTER TABLE public.lost_report_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lost contacts owner all" ON public.lost_report_contacts
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE TRIGGER touch_lost_report_contacts BEFORE UPDATE ON public.lost_report_contacts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Migrate existing contact data
INSERT INTO public.lost_report_contacts (lost_report_id, owner_id, contact)
  SELECT id, owner_id, contact FROM public.lost_reports
  WHERE contact IS NOT NULL AND contact <> ''
ON CONFLICT (lost_report_id) DO NOTHING;

-- Drop public contact column
ALTER TABLE public.lost_reports DROP COLUMN IF EXISTS contact;

-- 2. Restrict contact_messages INSERT to authenticated users
DROP POLICY IF EXISTS "contact insert validated" ON public.contact_messages;
CREATE POLICY "contact insert authenticated" ON public.contact_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    length(name) BETWEEN 1 AND 120
    AND length(email) BETWEEN 3 AND 200
    AND length(message) BETWEEN 1 AND 2000
  );

-- 3. Tighten storage upload policy to require owner-prefixed paths
DROP POLICY IF EXISTS "anima-media auth upload" ON storage.objects;
CREATE POLICY "anima-media auth upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'anima-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );