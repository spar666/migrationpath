-- Enable RLS on occupations_list (already exists but needs RLS)
ALTER TABLE public.occupations_list ENABLE ROW LEVEL SECURITY;

-- Allow public read access to occupations_list
CREATE POLICY "Public Read Occupations"
ON public.occupations_list
FOR SELECT
USING (true);