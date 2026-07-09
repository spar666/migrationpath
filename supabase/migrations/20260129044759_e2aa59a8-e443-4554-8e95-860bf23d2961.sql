-- Add missing columns to journey_milestones
ALTER TABLE public.journey_milestones 
ADD COLUMN IF NOT EXISTS milestone_name TEXT,
ADD COLUMN IF NOT EXISTS required_document_type TEXT,
ADD COLUMN IF NOT EXISTS icon_name TEXT DEFAULT 'circle';

-- Make title nullable so we can use milestone_name as the primary field
ALTER TABLE public.journey_milestones 
ALTER COLUMN title DROP NOT NULL;

-- Update existing records to populate milestone_name from title
UPDATE public.journey_milestones 
SET milestone_name = title 
WHERE milestone_name IS NULL AND title IS NOT NULL;