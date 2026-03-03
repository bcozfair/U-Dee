-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ==========================================
-- 1. Profiles (Update Existing)
-- ==========================================
-- Add emergency_contact if it doesn't exist
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'emergency_contact') then
        alter table public.profiles add column emergency_contact text;
    end if;
end
$$;

-- Ensure RLS is enabled
alter table public.profiles enable row level security;


-- ==========================================
-- 2. Families (Skip if exists)
-- ==========================================
create table if not exists public.families (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  invite_code text unique default substr(md5(random()::text), 0, 8),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  created_by uuid references public.profiles(id)
);

alter table public.families enable row level security;

-- ==========================================
-- 3. Family Members (Skip if exists)
-- ==========================================
create table if not exists public.family_members (
  family_id uuid references public.families(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text default 'member',
  joined_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (family_id, user_id)
);


alter table public.family_members enable row level security;

-- ==========================================
-- Helper Function to avoid RLS recursion
-- ==========================================
create or replace function public.get_my_family_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select family_id from public.family_members where user_id = auth.uid();
$$;

create or replace function public.get_my_admin_family_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select family_id from public.family_members where user_id = auth.uid() and role = 'admin';
$$;

-- ==========================================
-- Policies for family_members
-- ==========================================

-- Aggressively drop ALL existing policies on family_members to be safe
do $$
declare
  r record;
begin
  for r in select policyname from pg_policies where schemaname = 'public' and tablename = 'family_members'
  loop
    execute format('drop policy if exists %I on public.family_members', r.policyname);
  end loop;
end $$;

-- 1. View members: visible if you are in the same family OR it is your own record
create policy "View family members"
  on public.family_members for select
  using (
    family_id in ( select public.get_my_family_ids() )
    or
    user_id = auth.uid()
  );

-- 2. Manage members (Delete): Leaves or Admin removals
create policy "Manage family members"
  on public.family_members for delete
  using (
    user_id = auth.uid()
    or
    family_id in ( select public.get_my_admin_family_ids() )
  );



-- ==========================================
-- Policies for families
-- ==========================================

-- Aggressively drop ALL existing policies on families
do $$
declare
  r record;
begin
  for r in select policyname from pg_policies where schemaname = 'public' and tablename = 'families'
  loop
    execute format('drop policy if exists %I on public.families', r.policyname);
  end loop;
end $$;

create policy "View families"
  on public.families for select
  using (
    id in ( select public.get_my_family_ids() )
  );

create policy "Admin update families"
  on public.families for update
  using (
    id in ( select public.get_my_admin_family_ids() )
  );


-- ==========================================
-- 4. User Status (Create NEW Table)
-- ==========================================
create table if not exists public.user_status (
  user_id uuid references public.profiles(id) primary key,
  latitude float,
  longitude float,
  status_text text,
  is_online boolean default false,
  battery_level int,
  last_updated timestamp with time zone default timezone('utc'::text, now())
);

alter table public.user_status enable row level security;

-- Policies for user_status (Check existence to avoid errors)
do $$
begin
    if not exists (select 1 from pg_policies where policyname = 'Family members can view status' and tablename = 'user_status') then
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
    end if;

    if not exists (select 1 from pg_policies where policyname = 'Users can update their own status' and tablename = 'user_status') then
        create policy "Users can update their own status"
          on public.user_status for update
          using ( auth.uid() = user_id );
    end if;

    if not exists (select 1 from pg_policies where policyname = 'Users can insert their own status' and tablename = 'user_status') then
        create policy "Users can insert their own status"
          on public.user_status for insert
          with check ( auth.uid() = user_id );
    end if;
end
$$;

-- ==========================================
-- 5. Realtime Setup
-- ==========================================
-- Add tables to realtime publication (Catch errors if already added)
do $$
begin
  begin
    alter publication supabase_realtime add table public.user_status;
  exception when duplicate_object then
    null;
  end;
  
  begin
    alter publication supabase_realtime add table public.families;
  exception when duplicate_object then
    null;
  end;

  begin
    alter publication supabase_realtime add table public.family_members;
  exception when duplicate_object then
    null;
  end;
end
$$;

-- ==========================================
-- 6. Storage Setup (Avatars)
-- ==========================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Policies for Storage
drop policy if exists "Avatar images are publicly accessible." on storage.objects;
create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

drop policy if exists "Anyone can upload an avatar." on storage.objects;
create policy "Anyone can upload an avatar."
  on storage.objects for insert
  with check ( bucket_id = 'avatars' );

drop policy if exists "Anyone can update their own avatar." on storage.objects;
create policy "Anyone can update their own avatar."
  on storage.objects for update
  using ( auth.uid() = owner )
  with check ( bucket_id = 'avatars' );

drop policy if exists "Anyone can delete their own avatar." on storage.objects;
create policy "Anyone can delete their own avatar."
  on storage.objects for delete
  using ( bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text );

-- ==========================================
-- 7. Family RPC Functions
-- ==========================================

create or replace function public.create_family(name_input text)
returns uuid
language plpgsql
security definer
as $$
declare
  new_family_id uuid;
begin
  -- 1. Create family
  insert into public.families (name, created_by)
  values (name_input, auth.uid())
  returning id into new_family_id;

  -- 2. Add creator as admin member
  insert into public.family_members (family_id, user_id, role)
  values (new_family_id, auth.uid(), 'admin');

  return new_family_id;
end;
$$;

create or replace function public.join_family(invite_code_input text)
returns boolean
language plpgsql
security definer
as $$
declare
  target_family_id uuid;
begin
  -- 1. Find family by invite code
  select id into target_family_id
  from public.families
  where invite_code = invite_code_input;

  if target_family_id is null then
    return false;
  end if;

  -- 2. Check if already a member
  if exists (select 1 from public.family_members where family_id = target_family_id and user_id = auth.uid()) then
    return true; -- Already joined
  end if;

  -- 3. Add as member
  insert into public.family_members (family_id, user_id, role)
  values (target_family_id, auth.uid(), 'member');

  return true;
end;
$$;
