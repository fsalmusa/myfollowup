-- =====================================================================
-- MyFollowUp — Supabase Schema Migration
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Creates: groups, customers, follow_up_history tables + RLS policies.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. TABLES
-- ---------------------------------------------------------------------

create table if not exists public.groups (
  id          bigint generated always as identity primary key,
  name        text not null check (length(trim(name)) > 0),
  description text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.customers (
  id               bigint generated always as identity primary key,
  group_id         bigint not null references public.groups(id) on delete cascade,
  name             text not null check (length(trim(name)) > 0),
  phone            text not null default '',
  email_subscribe  text not null default '',
  email_family     text not null default '',
  subscribe_date   text not null default '',
  expiry_date      text not null default '',
  follow_up_status text not null default 'PENDING'
                   check (follow_up_status in ('PENDING','COMPLETED')),
  last_follow_up_at timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.follow_up_history (
  id          bigint generated always as identity primary key,
  customer_id bigint not null references public.customers(id) on delete cascade,
  action      text not null check (action in ('FOLLOW_UP','UNFOLLOW_UP','NOTE')),
  note        text not null default '',
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. INDEXES
-- ---------------------------------------------------------------------

create index if not exists idx_customers_group    on public.customers(group_id);
create index if not exists idx_customers_followup on public.customers(follow_up_status);
create index if not exists idx_customers_expiry   on public.customers(expiry_date);
create index if not exists idx_history_customer   on public.follow_up_history(customer_id);

-- ---------------------------------------------------------------------
-- 3. TRIGGERS — auto-update updated_at on groups & customers
-- ---------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_groups_updated_at on public.groups;
create trigger trg_groups_updated_at
  before update on public.groups
  for each row execute function public.set_updated_at();

drop trigger if exists trg_customers_updated_at on public.customers;
create trigger trg_customers_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS)
-- ---------------------------------------------------------------------
-- Strategy: tables are readable by anyone with the anon key (this is a
-- single-owner personal CRM). Writes require the anon key too — acceptable
-- for a private dashboard, but you can lock writes to an authenticated user
-- later by adding auth + using the `service_role` / `authenticated` role.
--
-- For a private single-user app served over HTTPS, anon read+write is fine
-- as long as you don't share the URL. To harden, swap `to anon` for
-- `to authenticated` and sign in before editing.

alter table public.groups            enable row level security;
alter table public.customers         enable row level security;
alter table public.follow_up_history enable row level security;

-- groups
drop policy if exists "groups_read"  on public.groups;
drop policy if exists "groups_write" on public.groups;
create policy "groups_read"  on public.groups for select using (true);
create policy "groups_write" on public.groups for insert with check (true);
create policy "groups_update" on public.groups for update using (true);
create policy "groups_delete" on public.groups for delete using (true);

-- customers
drop policy if exists "customers_read"  on public.customers;
drop policy if exists "customers_write" on public.customers;
create policy "customers_read"   on public.customers for select using (true);
create policy "customers_insert" on public.customers for insert with check (true);
create policy "customers_update" on public.customers for update using (true);
create policy "customers_delete" on public.customers for delete using (true);

-- follow_up_history
drop policy if exists "history_read"  on public.follow_up_history;
drop policy if exists "history_write" on public.follow_up_history;
create policy "history_read"   on public.follow_up_history for select using (true);
create policy "history_insert" on public.follow_up_history for insert with check (true);
create policy "history_update" on public.follow_up_history for update using (true);
create policy "history_delete" on public.follow_up_history for delete using (true);

-- =====================================================================
-- DONE. Next: run seed.sql (optional sample data) in the same editor.
-- =====================================================================
