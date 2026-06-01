-- Supabase setup for the current RTV Inventory Hub frontend.
-- Run this in Supabase SQL Editor for project xrfmfiaemmyfbizwafgv.
--
-- Important: this matches the current browser-only app, which reads and writes
-- directly with the publishable key. For production, move authentication and
-- password checks to Supabase Auth or a backend service.

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password text not null,
  role text not null check (role in ('admin', 'supervisor')),
  name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.supervisors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.users(id) on delete cascade,
  emp_id text,
  name text not null,
  email text,
  phone text,
  district text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists supervisors_user_id_key on public.supervisors(user_id);

create table if not exists public.districts (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_items (
  id text primary key,
  name text,
  type text,
  description text,
  category text,
  quantity numeric,
  unit text,
  location text,
  district text,
  status text,
  assigned_to text,
  assigned text,
  serial_number text,
  notes text,
  "lastUpdate" text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.movement_logs (
  id uuid primary key default gen_random_uuid(),
  item_id text,
  action text,
  details text,
  actor text,
  timestamp timestamptz not null default now()
);

create table if not exists public.field_officers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  district text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  type text,
  item_id text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- If the tables already existed, make sure the columns used by the frontend exist.
alter table public.users add column if not exists name text;
alter table public.users add column if not exists email text;
alter table public.users add column if not exists updated_at timestamptz not null default now();

alter table public.supervisors add column if not exists emp_id text;
alter table public.supervisors add column if not exists phone text;
alter table public.supervisors add column if not exists status text not null default 'active';
alter table public.supervisors add column if not exists updated_at timestamptz not null default now();

alter table public.inventory_items add column if not exists type text;
alter table public.inventory_items alter column id type text using id::text;
alter table public.inventory_items add column if not exists district text;
alter table public.inventory_items add column if not exists status text;
alter table public.inventory_items add column if not exists assigned text;
alter table public.inventory_items add column if not exists notes text;
alter table public.inventory_items add column if not exists "lastUpdate" text;
alter table public.inventory_items add column if not exists updated_at timestamptz not null default now();
alter table public.movement_logs alter column item_id type text using item_id::text;
alter table public.admin_notifications alter column item_id type text using item_id::text;

alter table public.field_officers add column if not exists district text;
alter table public.field_officers add column if not exists status text not null default 'active';
alter table public.field_officers add column if not exists updated_at timestamptz not null default now();

insert into public.districts (name)
values
  ('Amuru'), ('Gulu'), ('Isingiro'), ('Kabale'), ('Kagadi'), ('Kaliro'), ('Kamwengye'),
  ('Kanungu'), ('Kibaale'), ('Kiryandongo'), ('Kisoro'), ('Kyegegwa'), ('Kyenjojo'),
  ('Luuka'), ('Mbarara'), ('Mitooma'), ('Nwoya'), ('Rubanda'), ('Rubirizi'),
  ('Rukiga'), ('Rukungiri')
on conflict (name) do nothing;

insert into public.users (username, password, role, name, email)
values ('admin', 'admin123', 'admin', 'Admin', null)
on conflict (username) do update
set role = excluded.role,
    name = excluded.name,
    updated_at = now();

with supervisor_user as (
  insert into public.users (username, password, role, name, email)
  values ('sup_kagadi', 'password123', 'supervisor', 'Default Supervisor', 'sup.kagadi@rtv.org')
  on conflict (username) do update
  set role = excluded.role,
      name = excluded.name,
      email = excluded.email,
      updated_at = now()
  returning id
)
update public.supervisors s
set user_id = supervisor_user.id,
    name = 'Default Supervisor',
    email = 'sup.kagadi@rtv.org',
    phone = '0700123456',
    district = 'Kagadi',
    status = 'active',
    updated_at = now()
from supervisor_user
where s.emp_id = 'SUP-001';

with supervisor_user as (
  select id from public.users where username = 'sup_kagadi'
)
insert into public.supervisors (user_id, emp_id, name, email, phone, district, status)
select id, 'SUP-001', 'Default Supervisor', 'sup.kagadi@rtv.org', '0700123456', 'Kagadi', 'active'
from supervisor_user
where not exists (
  select 1
  from public.supervisors s
  where s.emp_id = 'SUP-001'
     or s.user_id = supervisor_user.id
);

-- The current frontend needs anonymous browser access to these tables.
-- If RLS is enabled in your project, these policies make the app visible again.
alter table public.users enable row level security;
alter table public.supervisors enable row level security;
alter table public.districts enable row level security;
alter table public.inventory_items enable row level security;
alter table public.movement_logs enable row level security;
alter table public.field_officers enable row level security;
alter table public.admin_notifications enable row level security;

drop policy if exists "rtv public users access" on public.users;
create policy "rtv public users access" on public.users
for all using (true) with check (true);

drop policy if exists "rtv public supervisors access" on public.supervisors;
create policy "rtv public supervisors access" on public.supervisors
for all using (true) with check (true);

drop policy if exists "rtv public districts access" on public.districts;
create policy "rtv public districts access" on public.districts
for all using (true) with check (true);

drop policy if exists "rtv public inventory access" on public.inventory_items;
create policy "rtv public inventory access" on public.inventory_items
for all using (true) with check (true);

drop policy if exists "rtv public movement logs access" on public.movement_logs;
create policy "rtv public movement logs access" on public.movement_logs
for all using (true) with check (true);

drop policy if exists "rtv public field officers access" on public.field_officers;
create policy "rtv public field officers access" on public.field_officers
for all using (true) with check (true);

drop policy if exists "rtv public notifications access" on public.admin_notifications;
create policy "rtv public notifications access" on public.admin_notifications
for all using (true) with check (true);
