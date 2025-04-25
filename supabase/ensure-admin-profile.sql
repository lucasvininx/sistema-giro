-- Script para garantir que o usuário admin tenha um perfil válido

-- Verificar se o usuário admin existe
DO $$
DECLARE
  admin_email TEXT := 'admin@sistema.com';
  admin_id UUID;
  admin_exists BOOLEAN;
BEGIN
  -- Verificar se o usuário existe
  SELECT EXISTS (SELECT 1 FROM auth.users WHERE email = admin_email) INTO admin_exists;
  
  IF NOT admin_exists THEN
    RAISE NOTICE 'Usuário admin não encontrado. Criando novo usuário...';
    
    -- Criar novo usuário admin
    INSERT INTO auth.users (
      id,
      email,
      email_confirmed_at,
      role
    )
    VALUES (
      gen_random_uuid(),
      admin_email,
      current_timestamp,
      'authenticated'
    )
    RETURNING id INTO admin_id;
    
    -- Definir senha para o usuário (senha: admin123)
    UPDATE auth.users
    SET encrypted_password = crypt('admin123', gen_salt('bf'))
    WHERE id = admin_id;
    
    -- Adicionar identidade
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at
    )
    VALUES (
      gen_random_uuid(),
      admin_id,
      jsonb_build_object('sub', admin_id::text, 'email', admin_email),
      'email',
      admin_email,
      current_timestamp
    );
  ELSE
    -- Obter ID do usuário existente
    SELECT id INTO admin_id FROM auth.users WHERE email = admin_email;
  END IF;
  
  -- Verificar se o perfil existe
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = admin_id) THEN
    RAISE NOTICE 'Perfil para admin não encontrado. Criando perfil...';
    
    -- Criar perfil para o admin
    INSERT INTO public.profiles (
      id,
      email,
      nome,
      role,
      created_at
    )
    VALUES (
      admin_id,
      admin_email,
      'Administrador',
      'master',
      current_timestamp
    );
  ELSE
    -- Garantir que o perfil tenha role master
    UPDATE public.profiles
    SET role = 'master', nome = 'Administrador'
    WHERE id = admin_id;
  END IF;
  
  RAISE NOTICE 'Usuário admin verificado e corrigido com sucesso!';
END $$;
