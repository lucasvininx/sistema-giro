-- Function to generate a UUID
CREATE OR REPLACE FUNCTION generate_uuid()
RETURNS UUID
LANGUAGE sql
AS $$
  SELECT gen_random_uuid();
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION generate_uuid TO authenticated;
