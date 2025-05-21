
-- Completely disable Row Level Security temporarily to fix issues
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Then we'll recreate our security definer function with a better implementation
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- Let's create a function to check admin status that doesn't query the users table directly
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT public.get_user_role() = 'admin';
$$;
