-- Allow a signed-in user to clear only the first-login password flag on their own profile.
-- No other profile fields are writable by authenticated clients.
drop policy if exists "user clears own password change flag" on public.user_profiles;
create policy "user clears own password change flag"
on public.user_profiles for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

revoke update on public.user_profiles from anon, authenticated;
grant update (must_change_password) on public.user_profiles to authenticated;
