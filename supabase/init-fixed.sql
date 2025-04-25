-- Create a function to safely check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Direct query to bypass RLS
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'master'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the problematic policy
DROP POLICY IF EXISTS "Administradores podem ver todos os perfis" ON public.profiles;

CREATE POLICY "Administradores podem ver todos os perfis"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- Also update the update policy
DROP POLICY IF EXISTS "Administradores podem atualizar todos os perfis" ON public.profiles;

CREATE POLICY "Administradores podem atualizar todos os perfis"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());
