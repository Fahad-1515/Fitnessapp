-- Create table to track AI coach API usage for rate limiting
CREATE TABLE IF NOT EXISTS public.ai_coach_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_coach_rate_limits_user_id ON public.ai_coach_rate_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_coach_rate_limits_window ON public.ai_coach_rate_limits(window_start);

-- Enable RLS
ALTER TABLE public.ai_coach_rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can only view their own rate limit data
CREATE POLICY "Users can view own rate limits"
ON public.ai_coach_rate_limits
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Only the service role can insert/update rate limits (edge function will use service role)
CREATE POLICY "Service role can manage rate limits"
ON public.ai_coach_rate_limits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Function to clean up old rate limit records (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.ai_coach_rate_limits
  WHERE window_start < NOW() - INTERVAL '1 hour';
END;
$$;