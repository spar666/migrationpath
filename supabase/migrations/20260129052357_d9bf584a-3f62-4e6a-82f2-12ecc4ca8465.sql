-- Add admin RLS policies for occupation_thresholds table

-- Allow admins to insert thresholds
CREATE POLICY "Admins can insert thresholds"
ON public.occupation_thresholds
FOR INSERT
WITH CHECK (is_admin());

-- Allow admins to update thresholds
CREATE POLICY "Admins can update thresholds"
ON public.occupation_thresholds
FOR UPDATE
USING (is_admin());

-- Allow admins to delete thresholds
CREATE POLICY "Admins can delete thresholds"
ON public.occupation_thresholds
FOR DELETE
USING (is_admin());