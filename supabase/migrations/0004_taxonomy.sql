-- Migration 0004: admin-added industries, roles and skills
--
-- Applied automatically by `npm run db:migrate` (also runs before `dev` and
-- `build` when SUPABASE_DB_URL is set). To apply by hand instead, paste this
-- whole file into Supabase -> SQL Editor -> Run. Safe to run more than once.
--
-- The built-in list lives in lib/data/filterHierarchy.ts; rows here are
-- appended to it. One row per addition:
--   industry only               -> a new industry
--   industry + sub_role         -> a new role under that industry
--   industry + sub_role + tag   -> a new skill under that role

create table if not exists public.taxonomy_entries (
  id         uuid primary key default gen_random_uuid(),
  industry   text not null check (length(industry) between 1 and 60),
  sub_role   text check (length(sub_role) between 1 and 60),
  tag        text check (length(tag) between 1 and 60),
  created_at timestamptz not null default now(),
  constraint taxonomy_entries_tag_needs_role check (tag is null or sub_role is not null)
);

create unique index if not exists taxonomy_entries_unique_idx
  on public.taxonomy_entries (lower(industry), lower(coalesce(sub_role, '')), lower(coalesce(tag, '')));

alter table public.taxonomy_entries enable row level security;

insert into public.schema_migrations (version) values ('0004')
on conflict (version) do nothing;
