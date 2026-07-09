-- Add partner_skills JSONB column to store partner's skills and English scores
ALTER TABLE public.consultation_questionnaires 
ADD COLUMN partner_skills jsonb DEFAULT NULL;

-- Add comment describing the structure
COMMENT ON COLUMN public.consultation_questionnaires.partner_skills IS 'Partner skills data: { occupation: string, years_experience: number, english_test_type: string, english_scores: object }';

-- Create index for admin lookups by user_id
CREATE INDEX IF NOT EXISTS idx_consultation_questionnaires_user_id 
ON public.consultation_questionnaires(user_id);

-- Create index for recent questionnaires
CREATE INDEX IF NOT EXISTS idx_consultation_questionnaires_submitted 
ON public.consultation_questionnaires(submitted_at DESC);