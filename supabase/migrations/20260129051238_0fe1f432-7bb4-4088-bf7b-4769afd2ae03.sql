-- Add admin RLS policies for occupations_list table to enable CRUD operations

-- Allow admins to insert new occupations
CREATE POLICY "Admins can insert occupations"
ON public.occupations_list
FOR INSERT
WITH CHECK (is_admin());

-- Allow admins to update occupations
CREATE POLICY "Admins can update occupations"
ON public.occupations_list
FOR UPDATE
USING (is_admin());

-- Allow admins to delete occupations
CREATE POLICY "Admins can delete occupations"
ON public.occupations_list
FOR DELETE
USING (is_admin());