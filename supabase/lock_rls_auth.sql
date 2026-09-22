-- =====================================================================
-- MyFollowUp — Lock RLS to authenticated users (Supabase Auth)
-- Run this AFTER creating your admin user in Dashboard → Auth → Users.
--
-- Before this: policies allowed `anon` (anyone) to read/write.
-- After this:  ONLY signed-in (authenticated) users can read/write.
-- =====================================================================

-- groups
drop policy if exists "groups_read"    on public.groups;
drop policy if exists "groups_write"   on public.groups;
drop policy if exists "groups_update"  on public.groups;
drop policy if exists "groups_delete"  on public.groups;
create policy "groups_read"    on public.groups for select using (auth.role() = 'authenticated');
create policy "groups_insert"  on public.groups for insert with check (auth.role() = 'authenticated');
create policy "groups_update"  on public.groups for update using (auth.role() = 'authenticated');
create policy "groups_delete"  on public.groups for delete using (auth.role() = 'authenticated');

-- customers
drop policy if exists "customers_read"  on public.customers;
drop policy if exists "customers_write" on public.customers;
create policy "customers_read"   on public.customers for select using (auth.role() = 'authenticated');
create policy "customers_insert" on public.customers for insert with check (auth.role() = 'authenticated');
create policy "customers_update" on public.customers for update using (auth.role() = 'authenticated');
create policy "customers_delete" on public.customers for delete using (auth.role() = 'authenticated');

-- follow_up_history
drop policy if exists "history_read"  on public.follow_up_history;
drop policy if exists "history_write" on public.follow_up_history;
create policy "history_read"   on public.follow_up_history for select using (auth.role() = 'authenticated');
create policy "history_insert" on public.follow_up_history for insert with check (auth.role() = 'authenticated');
create policy "history_update" on public.follow_up_history for update using (auth.role() = 'authenticated');
create policy "history_delete" on public.follow_up_history for delete using (auth.role() = 'authenticated');

-- =====================================================================
-- DONE. Now the app requires login. Data is invisible to anonymous users.
-- =====================================================================
