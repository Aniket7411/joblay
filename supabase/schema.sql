-- Joblay database schema for Supabase.
-- Run once: Supabase Dashboard → SQL Editor → New query → paste → Run.
-- Safe to re-run.

create table if not exists public.recruiters (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  email               text not null unique check (email = lower(email)),
  company             text,
  password_hash       text not null,
  reset_token_hash    text,
  reset_token_expires timestamptz,
  created_at          timestamptz not null default now()
);

-- Added after the first release; safe on existing databases.
alter table public.recruiters
  add column if not exists role text not null default 'recruiter'
  check (role in ('recruiter', 'admin'));

create index if not exists recruiters_reset_token_idx
  on public.recruiters (reset_token_hash)
  where reset_token_hash is not null;

create table if not exists public.jobs (
  id             uuid primary key default gen_random_uuid(),
  recruiter_id   uuid not null references public.recruiters (id) on delete cascade,
  title          text not null,
  company        text not null,
  location       text not null,
  job_profile    text not null,
  industry       text not null,
  sub_role       text not null,
  tags           text[] not null default '{}',
  description    text not null,
  criteria       text[] not null default '{}',
  contact_name   text,
  contact_email  text,
  contact_phone  text,
  attachment_url text,
  created_at     timestamptz not null default now(),
  -- Every JD must carry at least one way to reach the recruiter.
  constraint jobs_contact_required
    check (coalesce(contact_name, contact_email, contact_phone) is not null)
);

create index if not exists jobs_created_at_idx   on public.jobs (created_at desc);
create index if not exists jobs_recruiter_idx    on public.jobs (recruiter_id, created_at desc);
create index if not exists jobs_filters_idx      on public.jobs (location, job_profile, industry);
create index if not exists jobs_industry_sub_idx on public.jobs (industry, sub_role);
create index if not exists jobs_tags_idx         on public.jobs using gin (tags);

-- Lock both tables down: with RLS on and no policies, the public
-- (publishable/anon) key can't read or write anything. The app server
-- uses the secret key, which bypasses RLS.
alter table public.recruiters enable row level security;
alter table public.jobs       enable row level security;

-- ── Admin features ──────────────────────────────────────────────────
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
