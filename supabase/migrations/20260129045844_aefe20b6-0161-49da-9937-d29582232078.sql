-- Enable Realtime for points_config
ALTER PUBLICATION supabase_realtime ADD TABLE points_config;

-- Add admin policies for points_config CRUD operations
CREATE POLICY "Admins can insert points config"
ON public.points_config
FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Admins can update points config"
ON public.points_config
FOR UPDATE
USING (is_admin());

CREATE POLICY "Admins can delete points config"
ON public.points_config
FOR DELETE
USING (is_admin());