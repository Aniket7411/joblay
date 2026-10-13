# Joblay

A minimalist job board. Candidates browse and filter jobs and contact recruiters directly (call, WhatsApp, or email) — no candidate accounts. Recruiters sign up, post JDs, and manage them from a dashboard.

## Stack

| Concern | Service |
|---|---|
| App | Next.js 16 (App Router), React 19, Tailwind 4, Framer Motion |
| Database | **Supabase Postgres** — recruiters, jobs, reset tokens (`supabase/migrations/`) |
| File storage | **Supabase Storage** — optional JD attachments (PDF/Word) |
| Email | **Gmail SMTP** (Nodemailer) — password reset + welcome emails |
| Auth | Email/password, scrypt-hashed, signed httpOnly session cookie |

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in values
npm run dev
```

When the server starts it prints a **service status panel** (Supabase DB, Storage, Email, Auth, App URL) so you can see at a glance what's connected.

If Supabase is not configured, local dev falls back to in-memory sample data (login `recruiter@demo.com` / `Demo@1234`). It resets on restart. Production always requires Supabase.

If SMTP is not set, emails (including reset links) are printed to the server console.

## Database migrations

Schema changes live in `supabase/migrations/NNNN_name.sql` and are applied in order, once each, tracked in the `schema_migrations` table.

- **Automatic:** set `SUPABASE_DB_URL` (Supabase → Connect → *Session pooler* URI). Pending migrations then run before every `npm run dev` and `npm run build`, so a Vercel deploy upgrades the database first. A failing migration is rolled back and stops the build.
- **Manual:** `npm run db:status` lists what's applied; `npm run db:migrate` applies the rest. Without a DB URL, paste each pending file into the Supabase SQL Editor — every file is safe to re-run and records itself.
- **Adding a change:** create the next numbered file and bump `SCHEMA_VERSION` in `lib/schemaVersion.ts` (the runner refuses to run if they disagree).

If the database is behind the code, the startup panel says which version is missing and users see "being updated" instead of errors.

## Go live on Vercel

1. **Supabase** — create a project. Copy the Project URL and the **secret** key (`sb_secret_...`) from *Project Settings → API Keys*, and the *Session pooler* connection string as `SUPABASE_DB_URL`. Tables and the `jd-attachments` bucket are created automatically.
2. **Gmail** — turn on 2-Step Verification, then create an App Password at <https://myaccount.google.com/apppasswords>.
3. **Vercel** — import the GitHub repo, then add every variable from `.env.example` under *Settings → Environment Variables*. Set `NEXT_PUBLIC_APP_URL` to your production URL (e.g. `https://joblay.vercel.app`) and generate a fresh `AUTH_SECRET`.
4. Deploy. Check the Vercel function logs for the status panel. Register a recruiter account, post a job, and test *Forgot password* to confirm email works.

## Admin panel

Admins sign in on the normal login page and land on `/admin`:

- **Overview** — totals, jobs by industry/location, latest jobs and employers
- **Jobs** — every job with full details; edit or delete any job
- **Employers** — every account with full details and their jobs; suspend / reactivate, email a password reset, make / remove admin, delete
- **Messages** — contact-form messages and job reports; reply, resolve, delete
- **Download Excel** — workbook with Summary, Jobs, Employers and Messages sheets

Create an admin (or reset an admin's password — admins can't use email reset):

```bash
npm run create-admin -- someone@example.com "StrongPass123" "Their Name"
```

Suspended employers can't sign in and their jobs are hidden from the public board.

## API

### Job search — `GET /api/jobs` (public)

All parameters are optional. Multi-value filters take comma-separated values; unknown values are ignored.

| Param | Example | Meaning |
|---|---|---|
| `q` | `react native` | Keywords — every word must match title, company, skills, location or description |
| `location` | `Pune,Mumbai` | City (see `lib/data/filterHierarchy.ts`) |
| `industry` / `subRole` / `tags` | `IT` / `Developer` / `Java Developer,React Developer` | Industry → role → skills |
| `jobProfile` | `Fresher,Junior` | Seniority |
| `workMode` | `Remote,Hybrid` | Office / Remote / Hybrid |
| `jobType` | `Full-time,Internship` | Full-time, Part-time, Contract, Internship, Freelance, Temporary |
| `education` | `Graduate` | Minimum education |
| `experience` | `3` | Candidate's years — jobs whose range includes it |
| `salary` | `6` | Minimum salary in LPA |
| `postedWithin` | `7` | Days: 1, 3, 7, 15, 30 |
| `hasPhone` / `hasEmail` | `1` | Only jobs with that contact method |
| `sort` | `salary` | `newest` (default), `salary`, `experience` |
| `page` | `2` | Returns the first `page × 20` results |

Response: `{ success, data: { jobs, total, page, pageSize, hasMore } }`. The same parameters work on the home page URL, e.g. `/?workMode=Remote&tags=AWS`.

### Other endpoints

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/api/jobs` | POST | recruiter | Create a job (numbers may be sent as numbers or strings) |
| `/api/jobs/[id]` | PATCH / DELETE | owner or admin / owner | Edit / delete a job |
| `/api/jobs/[id]/status` | POST | owner or admin | `{ "action": "close" \| "reopen" \| "renew" }` — reopen/renew extend 30 days |
| `/api/uploads` | POST | recruiter | Upload a JD attachment to Supabase (multipart `file`) |
| `/api/contact` | POST | — | Contact form / job report |
| `/api/auth/register` · `login` · `logout` | POST | — | Recruiter account |
| `/api/auth/forgot-password` · `reset-password` | POST | — | Reset link (1 hour, single use) |
| `/api/admin/...` | various | admin | Employers, messages, job moderation, Excel export |

Jobs expire 30 days after posting (recruiters can renew). Each job has a public page at `/jobs/[id]` with Google for Jobs structured data; `/sitemap.xml` lists all live jobs.

## Code map

- `lib/repository.ts` — all data access (Supabase, or in-memory in dev)
- `lib/startup.ts` + `instrumentation.ts` — startup status panel
- `supabase/migrations/` + `scripts/migrate.mjs` — schema and the migration runner
- `lib/auth/` — password hashing, session cookie, current recruiter
- `lib/mail.ts` — Gmail SMTP emails
- `lib/supabase.ts` — Supabase client and attachment uploads
- `lib/data/filterHierarchy.ts` — locations, profiles, industry → sub-role → tags
