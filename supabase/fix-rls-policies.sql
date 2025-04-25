-- Script para corrigir as políticas RLS que estão causando recursão infinita

-- 1. Criar uma função de segurança para verificar se um usuário é administrador
-- Esta função usa SECURITY DEFINER para executar com privilégios elevados
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Acesso direto à tabela profiles sem passar pelas políticas RLS
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'master'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Remover as políticas problemáticas existentes
DROP POLICY IF EXISTS "Administradores podem ver todos os perfis" ON public.profiles;
DROP POLICY IF EXISTS "Administradores podem atualizar todos os perfis" ON public.profiles;

-- 3. Criar novas políticas que usam a função is_admin()
CREATE POLICY "Administradores podem ver todos os perfis"
  ON public.profiles FOR SELECT
  USING (public.is_admin() OR auth.uid() = id);

CREATE POLICY "Administradores podem atualizar todos os perfis"
  ON public.profiles FOR UPDATE
  USING (public.is_admin() OR auth.uid() = id);

-- 4. Criar uma função RPC para obter perfil por ID de forma segura
CREATE OR REPLACE FUNCTION public.get_profile_by_id(user_id UUID)
RETURNS SETOF public.profiles AS $$
BEGIN
  RETURN QUERY SELECT * FROM public.profiles WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Criar uma função para verificar se o usuário atual é administrador
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'master'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
