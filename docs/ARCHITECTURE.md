# Architecture

For developers changing the code. Read [SETUP.md](SETUP.md) first to get it running.

## Principles

- **Server-rendered data.** Pages load their data on the server (home, job page, dashboard, admin). The browser only calls the API for user actions — submitting a form, clicking Delete — never just to display a page.
- **One data layer.** All database access goes through `lib/repository.ts`. It uses Supabase when configured, or an in-memory store (`lib/data/mockStore.ts`) for local development without keys.
- **Optional services fail soft.** Each optional integration checks its own keys and turns itself off when they're missing. Only Supabase is required in production.
- **Validate at the edge, constrain in the database.** Zod validates every request; Postgres check constraints back up the important rules.

## Folder map

```
app/                         Routes (Next.js App Router)
  page.tsx                   Home: search + filters (reads filters from the URL)
  jobs/[id]/page.tsx         Job page + Google for Jobs JSON-LD
  dashboard/                 Recruiter area (layout.tsx enforces sign-in)
    post/page.tsx            Post / duplicate a job (?from=<id>)
    jobs/[id]/edit/page.tsx  Edit a job (owner or admin)
  admin/page.tsx             Admin panel (404 for non-admins)
  api/                       JSON API (see docs/API.md)
  sitemap.ts, robots.ts      SEO
  indexnow-key.txt/route.ts  IndexNow ownership file
  about, safety, faq, contact, privacy, terms, login, register, …
components/
  jobs/                      JobSearch (board), FilterPanel, JobCard, ContactActions
  forms/                     Post, login, register, password, contact forms
  admin/, dashboard/         Admin panel and recruiter dashboard (client components)
  layout/, ui/               Navbar, footer, buttons, inputs, Turnstile widget
lib/
  repository.ts              All reads/writes (Supabase or in-memory)
  jobQuery.ts                Search filters <-> URL query string; formatting helpers
  jobInput.ts                Validates and normalises job create/edit bodies
  validations.ts             Zod schemas shared by forms and API
  data/filterHierarchy.ts    Locations, industries -> roles -> skills, option lists
  taxonomy.ts                getTaxonomy(): built-in industries + admin additions (taxonomy_entries)
  auth/                      Password hashing, signed session cookie, current user, reset links
  supabase.ts                Supabase client and file uploads
  mail.ts                    SMTP emails
  ai/parseJd.ts              Gemini JD parsing + sanitising its output
  turnstile.ts, phone.ts     Bot check verification, phone validation
  indexing.ts                IndexNow / Google Indexing pings
  siteUrl.ts                 The site's public URL (env, Vercel, or localhost)
  startup.ts                 Status panel printed on server start (via instrumentation.ts)
  schemaVersion.ts           Schema version this code expects
supabase/migrations/         Numbered SQL migrations
scripts/                     migrate.mjs (migration runner), create-admin.mjs
```

## Data model

```
recruiters                          jobs
──────────────────────              ─────────────────────────────────────
id (uuid, pk)            ◄──────┐   id (uuid, pk)
name, email (unique), company   └── recruiter_id (fk, on delete cascade)
password_hash  (scrypt)             title, company, description, criteria[]
role     recruiter | admin          location, industry, sub_role, job_profile, tags[]
status   active | suspended         work_mode, job_type, education, openings
last_login_at                       experience_min, experience_max   (years)
reset_token_hash, reset_token_expires   salary_min, salary_max      (LPA, nullable)
created_at                          contact_name, contact_email, contact_phone
                                    attachment_url, urgent
contact_messages                    status active | closed, expires_at
──────────────────────              search_text (kept by trigger, trigram-indexed)
id, name, email, topic, message     created_at, updated_at
status open | resolved, created_at
                                    schema_migrations (version, applied_at)
taxonomy_entries  (admin-added categories)
──────────────────────
id, industry, sub_role?, tag?, created_at

job_stats  (per-job counters)       site_settings  (admin-editable)
──────────────────────              ──────────────────────
job_id (pk, fk → jobs, cascade)     key (pk), value (jsonb), updated_at
views, contacts                     e.g. 'bulk_hiring_popup'
```

`job_stats` is bumped by the `increment_job_stat(job, kind)` database function, so counting never touches the job row.

**Kept in the visitor's browser (localStorage), not the database:** saved jobs (`joblay-saved-jobs`), recent searches (`joblay-recent-searches`), the chosen colour palette (`joblay-palette`) and when the bulk hiring popup was closed (`joblay-bulk-popup`). Job view/contact counts are de-duplicated per session with sessionStorage.

Database rules: a job needs at least one contact field; work mode, job type and status are restricted to known values; experience and salary ranges must be ordered.

**Row-level security** is enabled on every table with no policies, so the public (publishable) Supabase key can read nothing. The server uses the secret key, which bypasses RLS. Never expose the secret key to the browser.

**A job is live** when `status = 'active'`, `expires_at > now()` and its recruiter is not suspended. Public search and the sitemap only show live jobs; the dashboard and admin panel show everything.

## Search

`GET /api/jobs` and the home page both call `searchJobs(parseJobQuery(params))`:
1. `lib/jobQuery.ts` parses the URL, dropping unknown values.
2. `lib/repository.ts` turns each filter into a database condition: `in` for lists, range checks for experience and salary, array overlap for skills, one `ilike` per keyword on `search_text` (served by a trigram index).
3. "Load more" returns the first `page × 20` rows with an exact total.

The filter sidebar changes the URL; Next.js re-renders the page on the server. There's no client-side filtering.

## Auth and security

- Passwords: scrypt with a random salt. Sessions: an HMAC-signed, HTTP-only, `SameSite=Lax` cookie (7 days), plus a non-sensitive `joblay_signed_in` cookie the navbar reads to avoid an API call.
- The current user is re-read from the database on every request (`lib/auth/current.ts`, cached per request), so suspensions and role changes apply immediately.
- Password reset tokens are random, stored only as a SHA-256 hash, valid 1 hour and single-use. Admins can't reset by email.
- Ownership is enforced in the queries: recruiters can only edit, close or delete rows with their own `recruiter_id`.
- Bot protection (Turnstile) on public forms; throwaway email domains blocked at registration; per-IP and per-user rate limits on contact and AI endpoints (in memory, per server instance).
- Search keywords are escaped before reaching the database; Gemini output is validated against the taxonomy before use; JSON-LD output is escaped.

## Database migrations

- Migrations are `supabase/migrations/NNNN_name.sql`, applied in order and recorded in `schema_migrations`. Every file is idempotent (`if not exists`) and records itself, so pasting it by hand in the SQL Editor is also safe.
- `scripts/migrate.mjs` runs each pending file in a transaction under an advisory lock. It runs before `dev` (errors are reported, the server still starts) and before `build` (errors fail the deploy).
- The app reads `schema_migrations` on startup and warns if it's behind `lib/schemaVersion.ts`. If a query hits a missing column, users see "being updated" instead of an error.

**To change the schema:** add `supabase/migrations/0005_your_change.sql` (start from an existing file's header and footer, keep it idempotent), bump `SCHEMA_VERSION` to `"0005"`, update `lib/repository.ts` and `types/index.ts`, then run `npm run db:migrate`.

## Common changes

| Change | Where |
|---|---|
| Add an industry, role or skill | Admins: Admin Panel → Categories (stored in `taxonomy_entries`). Built-in ones: `lib/data/filterHierarchy.ts`. Values are stored on jobs as text, so renaming one orphans existing jobs. Server code reads the merged list with `getTaxonomy()` from `lib/taxonomy.ts` and passes it to client components as a prop |
| Add a city | `lib/data/filterHierarchy.ts` |
| Add a filter | `lib/jobQuery.ts` (parse/serialise), `searchJobs` in `lib/repository.ts`, `components/jobs/FilterPanel.tsx`, chip label in `JobSearch.tsx` |
| Add a job field | migration + `types/index.ts` + `lib/repository.ts` (row mapping) + `lib/validations.ts` + `lib/jobInput.ts` + `JobPostForm.tsx` |
| Change an email | `lib/mail.ts` |
| Add an optional integration | its own `lib/*.ts` with an `isXEnabled()` check, plus a line in `checkOptional()` in `lib/startup.ts` |

## Testing approach

There's no automated test suite yet. Changes so far were verified with:
- `npx tsc --noEmit`, `npm run lint` and `npm run build`
- API scripts (curl) against the in-memory store and a live Supabase project
- Migrations run against a throwaway Postgres 17: fresh, partially migrated, concurrent and failing cases

Adding a test runner (for example Vitest for `lib/` and Playwright for the main flows) is a good next step.
