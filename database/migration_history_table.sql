-- Create location_history table for historical tracking
create table if not exists public.location_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  latitude float not null,
  longitude float not null,
  status_text text,
  battery_level int,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table public.location_history enable row level security;

-- Drop existing policies if any
drop policy if exists "Family members can view location history" on public.location_history;
drop policy if exists "Users can insert their own history" on public.location_history;

-- 1. View history: visible if you are in the same family as the target user
create policy "Family members can view location history"
  on public.location_history for select
  using (
    user_id in (
        select user_id from public.family_members
        where family_id in (select public.get_my_family_ids())
    )
    OR
    auth.uid() = user_id
  );

-- 2. Insert history: users can only record their own history
create policy "Users can insert their own history"
  on public.location_history for insert
  with check ( auth.uid() = user_id );

-- Add to realtime publication if needed (optional for history, but useful)
do $$
begin
  begin
    alter publication supabase_realtime add table public.location_history;
  exception when duplicate_object then
    null;
  end;
end $$;
