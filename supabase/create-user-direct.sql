-- Function to create a user directly in the database
CREATE OR REPLACE FUNCTION create_user_direct(
  p_email TEXT,
  p_password TEXT,
  p_nome TEXT,
  p_role TEXT DEFAULT 'funcionario'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_user json;
BEGIN
  -- Generate a UUID for the new user
  v_user_id := gen_random_uuid();
  
  -- Insert into auth.users table
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    aud,
    role,
    confirmation_token
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    p_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('nome', p_nome, 'role', p_role),
    now(),
    now(),
    'authenticated',
    'authenticated',
    encode(gen_random_bytes(32), 'hex')
  );

  -- Insert into auth.identities table
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', p_email),
    'email',
    now(),
    now(),
    now()
  );

  -- Insert or update the profile
  INSERT INTO public.profiles (
    id,
    email,
    nome,
    role,
    created_at
  ) VALUES (
    v_user_id,
    p_email,
    p_nome,
    p_role,
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    nome = p_nome,
    role = p_role;

  -- Return the user data
  SELECT jsonb_build_object(
    'id', v_user_id,
    'email', p_email,
    'nome', p_nome,
    'role', p_role
  ) INTO v_user;

  RETURN v_user;
EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION 'Error creating user: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_user_direct TO authenticated;
