-- Script completo para corrigir problemas de autenticação e perfil

-- 1. Desativar temporariamente RLS para diagnóstico
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Verificar e corrigir o perfil do usuário admin
DO $$
DECLARE
  admin_email TEXT := 'admin@sistema.com';
  admin_id UUID;
BEGIN
  -- Obter o ID do usuário
  SELECT id INTO admin_id FROM auth.users WHERE email = admin_email;
  
  IF admin_id IS NULL THEN
    RAISE NOTICE 'Usuário % não encontrado na tabela auth.users', admin_email;
  ELSE
    -- Verificar se o perfil existe
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = admin_id) THEN
      -- Criar o perfil se não existir
      INSERT INTO public.profiles (id, email, nome, role, created_at)
      VALUES (admin_id, admin_email, 'Administrador', 'master', current_timestamp);
      RAISE NOTICE 'Perfil criado para o usuário %', admin_email;
    ELSE
      -- Atualizar o perfil existente para garantir que seja admin
      UPDATE public.profiles
      SET role = 'master', nome = 'Administrador'
      WHERE id = admin_id;
      RAISE NOTICE 'Perfil atualizado para o usuário %', admin_email;
    END IF;
  END IF;
END $$;

-- 3. Criar uma função segura para verificar se um usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'master'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Criar uma função segura para obter o perfil do usuário
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS SETOF public.profiles AS $$
BEGIN
  RETURN QUERY SELECT * FROM public.profiles WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Remover todas as políticas existentes para profiles
DROP POLICY IF EXISTS "Usuários podem ver seus próprios perfis" ON public.profiles;
DROP POLICY IF EXISTS "Administradores podem ver todos os perfis" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios perfis" ON public.profiles;
DROP POLICY IF EXISTS "Administradores podem atualizar todos os perfis" ON public.profiles;

-- 6. Reativar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 7. Criar políticas simplificadas e seguras
-- Política para SELECT: usuários podem ver seu próprio perfil, admins podem ver todos
CREATE POLICY "profiles_select_policy" 
ON public.profiles FOR SELECT 
USING (
  id = auth.uid() OR public.is_admin()
);

-- Política para UPDATE: usuários podem atualizar seu próprio perfil, admins podem atualizar todos
CREATE POLICY "profiles_update_policy" 
ON public.profiles FOR UPDATE 
USING (
  id = auth.uid() OR public.is_admin()
);

-- 8. Criar um trigger para garantir que todo usuário tenha um perfil
CREATE OR REPLACE FUNCTION public.ensure_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, created_at)
  VALUES (NEW.id, NEW.email, 'funcionario', current_timestamp)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover o trigger existente se houver
DROP TRIGGER IF EXISTS ensure_user_profile_trigger ON auth.users;

-- Criar o novo trigger
CREATE TRIGGER ensure_user_profile_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.ensure_user_profile();

-- 9. Verificar e corrigir todos os usuários sem perfil
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT au.id, au.email 
    FROM auth.users au
    LEFT JOIN public.profiles p ON p.id = au.id
    WHERE p.id IS NULL
  LOOP
    INSERT INTO public.profiles (id, email, role, created_at)
    VALUES (user_record.id, user_record.email, 'funcionario', current_timestamp);
    RAISE NOTICE 'Perfil criado para usuário %', user_record.email;
  END LOOP;
END $$;
