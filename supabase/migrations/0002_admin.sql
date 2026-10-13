-- Migration 0002: admin roles, account status, contact messages
--
-- Applied automatically by `npm run db:migrate` (also runs before `dev` and
-- `build` when SUPABASE_DB_URL is set). To apply by hand instead, paste this
-- whole file into Supabase -> SQL Editor -> Run. Safe to run more than once.

create table if not exists public.schema_migrations (
  version    text primary key,
  applied_at timestamptz not null default now()
);
alter table public.schema_migrations enable row level security;

alter table public.recruiters
  add column if not exists role text not null default 'recruiter'
  check (role in ('recruiter', 'admin'));

alter table public.recruiters
  add column if not exists status text not null default 'active'
  check (status in ('active', 'suspended'));
alter table public.recruiters
  add column if not exists last_login_at timestamptz;

alter table public.jobs
  add column if not exists updated_at timestamptz not null default now();

-- Contact-page messages and job reports, reviewed in the admin panel.
create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  topic      text not null,
  message    text not null,
  status     text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now()
);
create index if not exists contact_messages_created_idx
  on public.contact_messages (status, created_at desc);
alter table public.contact_messages enable row level security;

insert into public.schema_migrations (version) values ('0002')
on conflict (version) do nothing;
