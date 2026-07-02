
CREATE TABLE public.ai_entitlements (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  free_used INT NOT NULL DEFAULT 0,
  paid_credits INT NOT NULL DEFAULT 0,
  stripe_customer_id TEXT,
  subscribed_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ai_entitlements TO authenticated;
GRANT ALL ON public.ai_entitlements TO service_role;

ALTER TABLE public.ai_entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own entitlement"
  ON public.ai_entitlements FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER ai_entitlements_touch
  BEFORE UPDATE ON public.ai_entitlements
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.consume_ai_credit(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row public.ai_entitlements;
  free_limit CONSTANT INT := 3;
BEGIN
  INSERT INTO public.ai_entitlements(user_id) VALUES (_user_id)
    ON CONFLICT (user_id) DO NOTHING;
  SELECT * INTO row FROM public.ai_entitlements WHERE user_id = _user_id FOR UPDATE;

  IF row.subscribed_until IS NOT NULL AND row.subscribed_until > now() THEN
    RETURN jsonb_build_object('ok', true, 'reason','subscription',
      'free_remaining', GREATEST(free_limit - row.free_used, 0),
      'paid_credits', row.paid_credits,
      'subscribed_until', row.subscribed_until);
  END IF;

  IF row.free_used < free_limit THEN
    UPDATE public.ai_entitlements SET free_used = free_used + 1 WHERE user_id = _user_id
      RETURNING * INTO row;
    RETURN jsonb_build_object('ok', true, 'reason','free',
      'free_remaining', GREATEST(free_limit - row.free_used, 0),
      'paid_credits', row.paid_credits,
      'subscribed_until', row.subscribed_until);
  END IF;

  IF row.paid_credits > 0 THEN
    UPDATE public.ai_entitlements SET paid_credits = paid_credits - 1 WHERE user_id = _user_id
      RETURNING * INTO row;
    RETURN jsonb_build_object('ok', true, 'reason','credit',
      'free_remaining', 0,
      'paid_credits', row.paid_credits,
      'subscribed_until', row.subscribed_until);
  END IF;

  RETURN jsonb_build_object('ok', false, 'reason','paywall',
    'free_remaining', 0,
    'paid_credits', 0,
    'subscribed_until', row.subscribed_until);
END;
$$;

REVOKE ALL ON FUNCTION public.consume_ai_credit(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_ai_credit(uuid) TO service_role;
