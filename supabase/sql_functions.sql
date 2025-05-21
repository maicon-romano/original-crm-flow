
-- Create an RPC function to safely update users
CREATE OR REPLACE FUNCTION public.update_user(
  user_id UUID,
  user_name TEXT,
  user_email TEXT,
  user_phone TEXT,
  user_position TEXT,
  user_role TEXT,
  user_active BOOLEAN
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.users
  SET 
    name = user_name,
    email = user_email,
    phone = user_phone,
    position = user_position,
    role = user_role,
    active = user_active,
    updated_at = now()
  WHERE id = user_id;
END;
$$;

-- Create an RPC function to get all users safely
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS SETOF public.users
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT * FROM public.users ORDER BY created_at DESC;
END;
$$;
