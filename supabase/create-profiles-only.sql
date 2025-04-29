-- Function to create a user directly in the profiles table only
-- This bypasses the auth system entirely
CREATE OR REPLACE FUNCTION create_profile_only(
  p_email TEXT,
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
  
  -- Insert directly into profiles table
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
  );

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
    RAISE EXCEPTION 'Error creating profile: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_profile_only TO authenticated;
