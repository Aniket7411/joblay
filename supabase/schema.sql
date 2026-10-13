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
