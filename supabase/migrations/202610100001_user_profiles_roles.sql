-- CarDekho portal: secure user profile and role mapping.
-- Apply in Supabase SQL Editor after reviewing existing policies.
create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role text not null check (role in ('Admin','Coordinator','Pricing','QC','TPA')),
  must_change_password boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

-- Users may read their own profile. Admin profile access is granted only through
-- a server-verified JWT app_metadata role claim (never user-editable user_metadata).
drop policy if exists "read own profile" on public.user_profiles;
create policy "read own profile"
on public.user_profiles for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "admins read all profiles" on public.user_profiles;
create policy "admins read all profiles"
on public.user_profiles for select
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'Admin');

-- No client INSERT/UPDATE/DELETE policies are created intentionally.
-- Only a trusted server-side Edge Function using SUPABASE_SERVICE_ROLE_KEY
-- may create accounts or change role/profile fields.
