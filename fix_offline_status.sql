-- Fix User Status RLS to allow viewing offline members
-- This replaces the complex join-based policy with a more robust subquery approach
-- ensuring that you can see the status of anyone in your families, even if they are offline.

drop policy if exists "Family members can view status" on public.user_status;

create policy "Family members can view status"
  on public.user_status for select
  using (
    user_id in (
        select user_id from public.family_members
        where family_id in (select public.get_my_family_ids())
    )
    OR
    auth.uid() = user_id
  );
