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

-- ── Job details, filters and lifecycle ──────────────────────────────
-- Salary is in lakhs per annum (LPA). experience_max / salary_max are always
-- set when the range is given, so range filters are simple comparisons.
alter table public.jobs add column if not exists work_mode text not null default 'Office';
alter table public.jobs add column if not exists job_type text not null default 'Full-time';
alter table public.jobs add column if not exists experience_min smallint not null default 0;
alter table public.jobs add column if not exists experience_max smallint not null default 30;
alter table public.jobs add column if not exists salary_min numeric(6, 2);
alter table public.jobs add column if not exists salary_max numeric(6, 2);
alter table public.jobs add column if not exists education text not null default 'Any';
alter table public.jobs add column if not exists openings smallint not null default 1;
alter table public.jobs add column if not exists status text not null default 'active';
alter table public.jobs add column if not exists expires_at timestamptz not null default (now() + interval '30 days');
alter table public.jobs add column if not exists search_text text not null default '';

do $$ begin
  alter table public.jobs add constraint jobs_work_mode_check
    check (work_mode in ('Office', 'Remote', 'Hybrid'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.jobs add constraint jobs_job_type_check
    check (job_type in ('Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance', 'Temporary'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.jobs add constraint jobs_status_check check (status in ('active', 'closed'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.jobs add constraint jobs_experience_check
    check (experience_min between 0 and 50 and experience_max between experience_min and 50);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.jobs add constraint jobs_salary_check
    check ((salary_min is null and salary_max is null)
        or (salary_min >= 0 and salary_max >= salary_min));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.jobs add constraint jobs_openings_check check (openings between 1 and 10000);
exception when duplicate_object then null; end $$;

-- Lower-cased text used for keyword search, kept in sync by a trigger.
create or replace function public.jobs_set_search_text()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.search_text := lower(concat_ws(' ',
    new.title, new.company, new.location, new.industry, new.sub_role,
    new.job_profile, new.work_mode, new.job_type,
    array_to_string(new.tags, ' '), new.description));
  return new;
end;
$$;

drop trigger if exists jobs_search_text on public.jobs;
create trigger jobs_search_text
  before insert or update on public.jobs
  for each row execute function public.jobs_set_search_text();

update public.jobs set search_text = '' where search_text = '';  -- backfill via trigger

create extension if not exists pg_trgm;
create index if not exists jobs_search_trgm_idx on public.jobs using gin (search_text gin_trgm_ops);
create index if not exists jobs_live_idx       on public.jobs (status, expires_at, created_at desc);
create index if not exists jobs_work_mode_idx  on public.jobs (work_mode);
create index if not exists jobs_job_type_idx   on public.jobs (job_type);
create index if not exists jobs_salary_idx     on public.jobs (salary_max);
create index if not exists jobs_experience_idx on public.jobs (experience_min, experience_max);
