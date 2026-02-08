-- ==========================================
-- FORCE RESET SCHEMA (With CASCADE)
-- ==========================================

-- Drop tables regardless of policies or dependencies
-- This automatically drops policies and foreign keys
drop table if exists public.user_status cascade;
drop table if exists public.family_members cascade;
drop table if exists public.families cascade;

-- Profiles: Add IF NOT EXISTS because it's linked to Auth
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  username text,
  avatar_url text,
  emergency_contact text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.profiles enable row level security;
-- Re-apply profile policies (drop first to avoid error if exists)
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
create policy "Public profiles are viewable by everyone." on public.profiles for select using ( true );
drop policy if exists "Users can update their own profile." on public.profiles;
create policy "Users can update their own profile." on public.profiles for update using ( auth.uid() = id );
drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile" on public.profiles for insert with check ( auth.uid() = id );


-- Create Families
create table public.families (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  invite_code text unique default substr(md5(random()::text), 0, 8),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  created_by uuid references public.profiles(id)
);
alter table public.families enable row level security;

-- Create Family Members
create table public.family_members (
  family_id uuid references public.families(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text default 'member',
  joined_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (family_id, user_id)
);
alter table public.family_members enable row level security;

-- Create User Status
create table public.user_status (
  user_id uuid references public.profiles(id) primary key,
  latitude float,
  longitude float,
  status_text text,
  is_online boolean default false,
  battery_level int,
  last_updated timestamp with time zone default timezone('utc'::text, now())
);
alter table public.user_status enable row level security;


-- ==========================================
-- POLICIES
-- ==========================================

create policy "Members can view their families"
  on public.families for select
  using (
    exists (
      select 1 from public.family_members
      where family_members.family_id = families.id
      and family_members.user_id = auth.uid()
    )
  );

create policy "Members can view other members in the same family"
  on public.family_members for select
  using (
    exists (
      select 1 from public.family_members as fm
      where fm.family_id = family_members.family_id
      and fm.user_id = auth.uid()
    )
  );

create policy "Family members can view status"
  on public.user_status for select
  using (
    exists (
      select 1 from public.family_members as my_fam
      join public.family_members as their_fam on my_fam.family_id = their_fam.family_id
      where my_fam.user_id = auth.uid()
      and their_fam.user_id = user_status.user_id
    )
    OR
    auth.uid() = user_id
  );

create policy "Users can update their own status"
  on public.user_status for update
  using ( auth.uid() = user_id );

create policy "Users can insert their own status"
  on public.user_status for insert
  with check ( auth.uid() = user_id );

-- ==========================================
-- REALTIME
-- ==========================================
-- Wrap in DO block to handle duplicate/not-exists gracefully
do $$
begin
  begin
    alter publication supabase_realtime add table public.user_status;
  exception when others then null; end;
  
  begin
    alter publication supabase_realtime add table public.families;
  exception when others then null; end;

  begin
    alter publication supabase_realtime add table public.family_members;
  exception when others then null; end;
end
$$;
