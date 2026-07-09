-- Add ANZSCO code to profiles for occupation-specific features
ALTER TABLE public.profiles 
ADD COLUMN anzsco_code text;

-- Add index for faster lookups
CREATE INDEX idx_profiles_anzsco_code ON public.profiles(anzsco_code);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.anzsco_code IS 'User selected ANZSCO occupation code for threshold matching';