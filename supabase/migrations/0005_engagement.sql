-- Migration 0005: urgent jobs, view/contact counts, site settings
--
-- Applied automatically by `npm run db:migrate` (also runs before `dev` and
-- `build` when SUPABASE_DB_URL is set). To apply by hand instead, paste this
-- whole file into Supabase -> SQL Editor -> Run. Safe to run more than once.

-- Recruiter-set "Urgent hiring" badge.
alter table public.jobs add column if not exists urgent boolean not null default false;

-- Views and contact taps per job, shown on the recruiter dashboard. Kept
-- apart from jobs so counting never touches the job row or its updated_at.
create table if not exists public.job_stats (
  job_id   uuid primary key references public.jobs (id) on delete cascade,
  views    integer not null default 0,
  contacts integer not null default 0
);
alter table public.job_stats enable row level security;

-- Atomic +1. kind is 'view' or 'contact'; unknown jobs are ignored.
create or replace function public.increment_job_stat(p_job uuid, p_kind text)
returns void
language sql
set search_path = ''
as $$
  insert into public.job_stats (job_id, views, contacts)
  select p_job, (p_kind = 'view')::int, (p_kind = 'contact')::int
  where exists (select 1 from public.jobs where id = p_job)
  on conflict (job_id) do update
    set views    = public.job_stats.views + excluded.views,
        contacts = public.job_stats.contacts + excluded.contacts;
$$;

-- Admin-editable settings, one JSON value per key (e.g. 'bulk_hiring_popup').
create table if not exists public.site_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;

insert into public.schema_migrations (version) values ('0005')
on conflict (version) do nothing;
