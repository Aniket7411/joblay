# Joblay

A simple, fast job board for India. Candidates search and filter jobs, then contact the recruiter directly by phone, WhatsApp or email — no candidate accounts. Recruiters sign up, post jobs and manage them; admins moderate everything.

## Features

**Candidates (no sign-up)**
- Keyword + city search, and 13 combinable filters: work mode, location, experience, salary, industry → role → skills, seniority, job type, education, date posted, contact method
- Filters live in the URL (shareable, bookmarkable); sort by newest, salary or experience
- A page per job with full details, WhatsApp share and "Report this job"

**Recruiters**
- Post jobs with experience/salary ranges, work mode, job type, education, openings and an optional PDF/Word JD
- Optional "paste a JD → auto-fill the form" (Google Gemini)
- Edit, duplicate, close/reopen and renew jobs (listings expire after 30 days)

**Admins** — dashboard of all jobs, employers and messages; edit/delete any job; suspend, reset or delete employers; Excel export

**Platform** — Google for Jobs structured data, sitemap, instant indexing pings, bot protection, automatic database migrations, and every optional service degrades gracefully when its key is missing.

## Quick start

```bash
npm install
cp .env.example .env      # fill in at least the Supabase keys
npm run dev               # applies database migrations, then starts on http://localhost:3000
```

Without Supabase keys the app runs on built-in demo data (`recruiter@demo.com` / `Demo@1234`, admin `admin@demo.com` / `Demo@1234`). On start, the terminal prints a status panel showing which services are connected.

## Documentation

| Guide | For |
|---|---|
| [docs/SETUP.md](docs/SETUP.md) | Environment variables, getting each key, deploying to Vercel, troubleshooting |
| [docs/ADMIN_GUIDE.md](docs/ADMIN_GUIDE.md) | Running the site day to day as an admin |
| [docs/API.md](docs/API.md) | Integrating with Joblay's HTTP API |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | How the code is organised, data model, security, migrations |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Apply pending migrations (if `SUPABASE_DB_URL` is set), start the dev server |
| `npm run build` / `npm start` | Apply migrations, production build / serve it |
| `npm run db:status` | List applied and pending database migrations |
| `npm run db:migrate` | Apply pending migrations |
| `npm run create-admin -- <email> <password> [name]` | Create an admin, or reset an admin's password |
| `npm run lint` | ESLint |

## Stack

Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · Supabase (Postgres + Storage) · Gmail SMTP via Nodemailer · Zod
