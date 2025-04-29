-- Function to create a user and profile in one transaction
CREATE OR REPLACE FUNCTION create_user_with_profile(
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
  -- Create the user in auth.users
  INSERT INTO auth.users (
    email,
    email_confirmed_at,
    encrypted_password,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role
  )
  VALUES (
    p_email,
    now(),
    crypt(p_password, gen_salt('bf')),
    '{"provider":"email","providers":["email"]}',
    json_build_object('nome', p_nome, 'role', p_role),
    'authenticated',
    'authenticated'
  )
  RETURNING id INTO v_user_id;

  -- Create the identity
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
    v_user_id,
    json_build_object('sub', v_user_id::text, 'email', p_email),
    'email',
    p_email,
    now()
  );

  -- Update or create the profile
  INSERT INTO public.profiles (
    id,
    email,
    nome,
    role,
    created_at
  )
  VALUES (
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
  SELECT json_build_object(
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
GRANT EXECUTE ON FUNCTION create_user_with_profile TO authenticated;
