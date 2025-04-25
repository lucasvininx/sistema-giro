-- Create an RPC function to safely get a profile by ID
CREATE OR REPLACE FUNCTION public.get_profile_by_id(user_id UUID)
RETURNS SETOF public.profiles AS $$
BEGIN
  RETURN QUERY SELECT * FROM public.profiles WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
