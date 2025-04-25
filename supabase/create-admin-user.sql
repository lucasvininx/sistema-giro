-- Script para criar um novo usuário administrador

-- 1. Criar o usuário na tabela auth.users
INSERT INTO auth.users (
  id,
  email,
  email_confirmed_at,
  role
)
VALUES (
  gen_random_uuid(), -- Gera um UUID aleatório
  'admin@sistema.com', -- Email do administrador
  current_timestamp, -- Email já confirmado
  'authenticated'
)
ON CONFLICT (email) DO NOTHING
RETURNING id;

-- 2. Obter o ID do usuário recém-criado ou existente
DO $$
DECLARE
  admin_id uuid;
BEGIN
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@sistema.com';
  
  -- 3. Adicionar a senha para o usuário (senha: admin123)
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
    jsonb_build_object('sub', admin_id::text, 'email', 'admin@sistema.com'),
    'email',
    'admin@sistema.com',
    current_timestamp
  )
  ON CONFLICT ON CONSTRAINT identities_pkey DO NOTHING;

  -- 4. Atualizar ou criar o perfil do usuário como administrador
  INSERT INTO public.profiles (
    id,
    email,
    nome,
    role
  )
  VALUES (
    admin_id,
    'admin@sistema.com',
    'Administrador',
    'master'
  )
  ON CONFLICT (id) DO UPDATE SET
    nome = 'Administrador',
    role = 'master';
END $$;

-- 5. Definir a senha para o usuário admin (senha: admin123)
-- Nota: Este método é para o Supabase v1. Se você estiver usando uma versão mais recente,
-- pode ser necessário usar outro método para definir a senha.
UPDATE auth.users
SET encrypted_password = crypt('admin123', gen_salt('bf'))
WHERE email = 'admin@sistema.com';
