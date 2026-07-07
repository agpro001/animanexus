
-- Track daily free usage for signed-in users
ALTER TABLE public.ai_entitlements
  ADD COLUMN IF NOT EXISTS free_used_today INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS free_day DATE NOT NULL DEFAULT CURRENT_DATE;

-- Anonymous device usage table
CREATE TABLE IF NOT EXISTS public.ai_anon_usage (
  device_id TEXT PRIMARY KEY,
  used INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.ai_anon_usage TO service_role;
ALTER TABLE public.ai_anon_usage ENABLE ROW LEVEL SECURITY;
-- No public policies; access only via SECURITY DEFINER RPCs / service role.

-- Rewrite signed-in credit consumption: 7 free/day, then paid credits or subscription
CREATE OR REPLACE FUNCTION public.consume_ai_credit(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row public.ai_entitlements;
  daily_limit CONSTANT INT := 7;
BEGIN
  INSERT INTO public.ai_entitlements(user_id) VALUES (_user_id)
    ON CONFLICT (user_id) DO NOTHING;
  SELECT * INTO row FROM public.ai_entitlements WHERE user_id = _user_id FOR UPDATE;

  -- Reset daily counter if new day
  IF row.free_day IS DISTINCT FROM CURRENT_DATE THEN
    UPDATE public.ai_entitlements
      SET free_used_today = 0, free_day = CURRENT_DATE
      WHERE user_id = _user_id
      RETURNING * INTO row;
  END IF;

  -- Active subscription
  IF row.subscribed_until IS NOT NULL AND row.subscribed_until > now() THEN
    RETURN jsonb_build_object('ok', true, 'reason','subscription',
      'free_remaining', GREATEST(daily_limit - row.free_used_today, 0),
      'paid_credits', row.paid_credits,
      'subscribed_until', row.subscribed_until);
  END IF;

  -- Daily free
  IF row.free_used_today < daily_limit THEN
    UPDATE public.ai_entitlements SET free_used_today = free_used_today + 1
      WHERE user_id = _user_id
      RETURNING * INTO row;
    RETURN jsonb_build_object('ok', true, 'reason','free',
      'free_remaining', GREATEST(daily_limit - row.free_used_today, 0),
      'paid_credits', row.paid_credits,
      'subscribed_until', row.subscribed_until);
  END IF;

  -- Paid one-off credits
  IF row.paid_credits > 0 THEN
    UPDATE public.ai_entitlements SET paid_credits = paid_credits - 1
      WHERE user_id = _user_id
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

-- Anonymous device consumption: 4 lifetime free
CREATE OR REPLACE FUNCTION public.consume_anon_credit(_device_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row public.ai_anon_usage;
  anon_limit CONSTANT INT := 4;
BEGIN
  IF _device_id IS NULL OR length(_device_id) < 8 THEN
    RETURN jsonb_build_object('ok', false, 'reason','invalid_device', 'free_remaining', 0);
  END IF;
  INSERT INTO public.ai_anon_usage(device_id) VALUES (_device_id)
    ON CONFLICT (device_id) DO NOTHING;
  SELECT * INTO row FROM public.ai_anon_usage WHERE device_id = _device_id FOR UPDATE;

  IF row.used < anon_limit THEN
    UPDATE public.ai_anon_usage
      SET used = used + 1, updated_at = now()
      WHERE device_id = _device_id
      RETURNING * INTO row;
    RETURN jsonb_build_object('ok', true, 'reason','anon_free',
      'free_remaining', GREATEST(anon_limit - row.used, 0));
  END IF;

  RETURN jsonb_build_object('ok', false, 'reason','signup_required',
    'free_remaining', 0);
END;
$$;

CREATE TRIGGER ai_anon_usage_touch BEFORE UPDATE ON public.ai_anon_usage
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
