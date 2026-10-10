-- Allow Admin users to read audit history in the portal.
-- Admin is verified against the caller's own user_profiles row; users cannot
-- grant themselves this role through client-side profile updates.
alter table public.audit_trail enable row level security;

grant select on public.audit_trail to authenticated;

drop policy if exists "admins read audit trail" on public.audit_trail;
create policy "admins read audit trail"
on public.audit_trail
for select
to authenticated
using (
  exists (
    select 1
    from public.user_profiles up
    where up.user_id = auth.uid()
      and up.role = 'Admin'
      and up.is_active = true
  )
);
