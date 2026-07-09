-- Add consultation notes and strategy delivery tracking to profiles
ALTER TABLE public.profiles
ADD COLUMN consultation_notes text DEFAULT NULL,
ADD COLUMN strategy_delivered_at timestamp with time zone DEFAULT NULL;

-- Add RLS policy for admins to update consultation notes
CREATE POLICY "Admins can update consultation notes"
ON public.profiles
FOR UPDATE
USING (is_admin())
WITH CHECK (is_admin());

-- Create index for efficient querying of users with delivered strategies
CREATE INDEX idx_profiles_strategy_delivered ON public.profiles(strategy_delivered_at)
WHERE strategy_delivered_at IS NOT NULL;