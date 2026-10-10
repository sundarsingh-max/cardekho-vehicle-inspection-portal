-- Fix schema mismatches shown by the Client Master and MMV Master forms.
-- Also allow only active Admin profiles to write master records.
alter table public.clients add column if not exists client_code text;
alter table public.mmv_master add column if not exists year text;

alter table public.clients enable row level security;
alter table public.mmv_master enable row level security;
alter table public.location_master enable row level security;

grant select, insert, update, delete on public.clients to authenticated;
grant select, insert, update, delete on public.mmv_master to authenticated;
grant select, insert, update, delete on public.location_master to authenticated;

drop policy if exists "active admins manage clients" on public.clients;
create policy "active admins manage clients"
on public.clients
for all
to authenticated
using (
  exists (
    select 1 from public.user_profiles up
    where up.user_id = (select auth.uid())
      and up.role = 'Admin'
      and up.is_active = true
  )
)
with check (
  exists (
    select 1 from public.user_profiles up
    where up.user_id = (select auth.uid())
      and up.role = 'Admin'
      and up.is_active = true
  )
);

drop policy if exists "active admins manage mmv master" on public.mmv_master;
create policy "active admins manage mmv master"
on public.mmv_master
for all
to authenticated
using (
  exists (
    select 1 from public.user_profiles up
    where up.user_id = (select auth.uid())
      and up.role = 'Admin'
      and up.is_active = true
  )
)
with check (
  exists (
    select 1 from public.user_profiles up
    where up.user_id = (select auth.uid())
      and up.role = 'Admin'
      and up.is_active = true
  )
);

drop policy if exists "active admins manage location master" on public.location_master;
create policy "active admins manage location master"
on public.location_master
for all
to authenticated
using (
  exists (
    select 1 from public.user_profiles up
    where up.user_id = (select auth.uid())
      and up.role = 'Admin'
      and up.is_active = true
  )
)
with check (
  exists (
    select 1 from public.user_profiles up
    where up.user_id = (select auth.uid())
      and up.role = 'Admin'
      and up.is_active = true
  )
);

-- Ask PostgREST to reload table metadata after the new columns are added.
notify pgrst, 'reload schema';
