-- Additional server-side authorization hardening for CarDekho portal.
-- Apply after the user_profiles table exists.
alter table public.user_profiles enable row level security;

-- Recreate the profile policies in a deterministic way.
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

-- Explicitly remove any broad client-side write policies that might have been
-- added during experimentation. Writes are performed by trusted Edge Functions.
drop policy if exists "users insert profiles" on public.user_profiles;
drop policy if exists "users update profiles" on public.user_profiles;
drop policy if exists "users delete profiles" on public.user_profiles;
drop policy if exists "authenticated can insert profiles" on public.user_profiles;
drop policy if exists "authenticated can update profiles" on public.user_profiles;
drop policy if exists "authenticated can delete profiles" on public.user_profiles;

revoke insert, update, delete on public.user_profiles from anon, authenticated;
grant select on public.user_profiles to authenticated;

create index if not exists user_profiles_role_idx on public.user_profiles(role);
create index if not exists user_profiles_active_idx on public.user_profiles(is_active);

-- Helper to evaluate a trusted role claim from the verified JWT.
create or replace function public.current_app_role()
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')
$$;

revoke all on function public.current_app_role() from public;
grant execute on function public.current_app_role() to authenticated;
