-- 1. Ensure RLS is ENABLED (Critical)
ALTER TABLE public.location_history ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing permissive policies (if any) to reset
DROP POLICY IF EXISTS "Enable read access for all users" ON public.location_history;
DROP POLICY IF EXISTS "Users can view their own location history" ON public.location_history;
DROP POLICY IF EXISTS "Users can delete their own location history" ON public.location_history;

-- 3. Create Strict Policies

-- Allow Users to SEE only their OWN history
CREATE POLICY "Users can view their own location history"
ON public.location_history
FOR SELECT
USING (auth.uid() = user_id);

-- Allow Users to INSERT their own history
CREATE POLICY "Users can insert their own location history"
ON public.location_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow Users to DELETE their own history
CREATE POLICY "Users can delete their own location history"
ON public.location_history
FOR DELETE
USING (auth.uid() = user_id);
