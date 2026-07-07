
REVOKE ALL ON FUNCTION public.consume_anon_credit(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.consume_ai_credit(uuid) FROM PUBLIC, anon, authenticated;
