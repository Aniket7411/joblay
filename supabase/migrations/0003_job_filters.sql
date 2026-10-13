-- Migration 0003: job details, search filters and expiry
--
-- Applied automatically by `npm run db:migrate` (also runs before `dev` and
-- `build` when SUPABASE_DB_URL is set). To apply by hand instead, paste this
-- whole file into Supabase -> SQL Editor -> Run. Safe to run more than once.

create table if not exists public.schema_migrations (
  version    text primary key,
  applied_at timestamptz not null default now()
);
alter table public.schema_migrations enable row level security;

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

insert into public.schema_migrations (version) values ('0003')
on conflict (version) do nothing;
