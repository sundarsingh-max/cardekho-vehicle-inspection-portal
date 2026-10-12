-- Enforce Client + Zone scopes for every non-Admin portal role.
-- The existing coordinator_case_scopes table is retained for compatibility,
-- but its rows now represent Client + Zone grants for Coordinator, TPA, QC, and Pricing.
-- Admin profiles retain full access. Non-Admin users with no grants see no cases.
-- IMPORTANT: assign scopes to all active non-Admin users before applying this migration.

create index if not exists coordinator_case_scopes_user_client_zone_idx
  on public.coordinator_case_scopes(user_id, client_id, zone);

drop policy if exists "case scope gate select" on public.cases;
create policy "case scope gate select"
on public.cases as restrictive
for select to authenticated
using (
  exists (
    select 1 from public.user_profiles up
    where up.user_id = (select auth.uid())
      and coalesce(up.is_active, false) = true
      and (
        up.role = 'Admin'
        or exists (
          select 1 from public.coordinator_case_scopes s
          where s.user_id = up.user_id
            and s.client_id = public.cases.client_id::text
            and lower(trim(s.zone)) = lower(trim(public.cases.zone))
        )
      )
  )
);

drop policy if exists "case scope gate insert" on public.cases;
create policy "case scope gate insert"
on public.cases as restrictive
for insert to authenticated
with check (
  exists (
    select 1 from public.user_profiles up
    where up.user_id = (select auth.uid())
      and coalesce(up.is_active, false) = true
      and (
        up.role = 'Admin'
        or exists (
          select 1 from public.coordinator_case_scopes s
          where s.user_id = up.user_id
            and s.client_id = public.cases.client_id::text
            and lower(trim(s.zone)) = lower(trim(public.cases.zone))
        )
      )
  )
);

drop policy if exists "case scope gate update" on public.cases;
create policy "case scope gate update"
on public.cases as restrictive
for update to authenticated
using (
  exists (
    select 1 from public.user_profiles up
    where up.user_id = (select auth.uid())
      and coalesce(up.is_active, false) = true
      and (
        up.role = 'Admin'
        or exists (
          select 1 from public.coordinator_case_scopes s
          where s.user_id = up.user_id
            and s.client_id = public.cases.client_id::text
            and lower(trim(s.zone)) = lower(trim(public.cases.zone))
        )
      )
  )
)
with check (
  exists (
    select 1 from public.user_profiles up
    where up.user_id = (select auth.uid())
      and coalesce(up.is_active, false) = true
      and (
        up.role = 'Admin'
        or exists (
          select 1 from public.coordinator_case_scopes s
          where s.user_id = up.user_id
            and s.client_id = public.cases.client_id::text
            and lower(trim(s.zone)) = lower(trim(public.cases.zone))
        )
      )
  )
);

drop policy if exists "case scope gate delete" on public.cases;
create policy "case scope gate delete"
on public.cases as restrictive
for delete to authenticated
using (
  exists (
    select 1 from public.user_profiles up
    where up.user_id = (select auth.uid())
      and coalesce(up.is_active, false) = true
      and (
        up.role = 'Admin'
        or exists (
          select 1 from public.coordinator_case_scopes s
          where s.user_id = up.user_id
            and s.client_id = public.cases.client_id::text
            and lower(trim(s.zone)) = lower(trim(public.cases.zone))
        )
      )
  )
);

notify pgrst, 'reload schema';
