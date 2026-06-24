
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM public, anon, authenticated;

DROP POLICY IF EXISTS "sight auth insert" ON public.sightings;
CREATE POLICY "sight auth insert" ON public.sightings FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "wild auth insert" ON public.wildlife_alerts;
CREATE POLICY "wild auth insert" ON public.wildlife_alerts FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "contact insert anyone" ON public.contact_messages;
CREATE POLICY "contact insert validated" ON public.contact_messages FOR INSERT
  WITH CHECK (length(name) BETWEEN 1 AND 120 AND length(email) BETWEEN 3 AND 200 AND length(message) BETWEEN 1 AND 2000);
