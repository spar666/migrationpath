-- Enable RLS on occupation_thresholds table
ALTER TABLE public.occupation_thresholds ENABLE ROW LEVEL SECURITY;

-- Allow public read access to occupation_thresholds
CREATE POLICY "Public Read Occupation Thresholds"
ON public.occupation_thresholds
FOR SELECT
USING (true);