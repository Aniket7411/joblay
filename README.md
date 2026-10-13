# Joblay

A minimalist job board. Candidates browse and filter jobs and contact recruiters directly (call, WhatsApp, or email) — no candidate accounts. Recruiters sign up, post JDs, and manage them from a dashboard.

## Stack

| Concern | Service |
|---|---|
| App | Next.js 16 (App Router), React 19, Tailwind 4, Framer Motion |
| Database | **MongoDB Atlas** (Mongoose) — recruiters, jobs, reset tokens |
| File storage | **Supabase Storage** — optional JD attachments (PDF/Word) |
| Email | **Gmail SMTP** (Nodemailer) — password reset + welcome emails |
| Auth | Email/password, scrypt-hashed, signed httpOnly session cookie |

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in values
npm run dev
```

If `MONGODB_URI` is not set, local dev falls back to in-memory sample data (login `recruiter@demo.com` / `Demo@1234`). It resets on restart. Production always requires MongoDB.

If SMTP is not set, emails (including reset links) are printed to the server console.

## Go live on Vercel

1. **MongoDB Atlas** — create a free M0 cluster, add a database user, and under *Network Access* allow `0.0.0.0/0`. Copy the connection string.
2. **Gmail** — turn on 2-Step Verification, then create an App Password at <https://myaccount.google.com/apppasswords>.
3. **Supabase** (optional) — create a project, create a **public** bucket named `jd-attachments`, copy the Project URL and `service_role` key.
4. **Vercel** — import the GitHub repo, then add every variable from `.env.example` under *Settings → Environment Variables*. Set `NEXT_PUBLIC_APP_URL` to your production URL (e.g. `https://joblay.vercel.app`) and generate a fresh `AUTH_SECRET`.
5. Deploy. Register a recruiter account, post a job, and test *Forgot password* to confirm email works.

## API

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/api/jobs` | GET | — | List jobs. Query: `location, jobProfile, industry, subRole, tags (csv), search`; `mine=1` for the signed-in recruiter's jobs |
| `/api/jobs` | POST | ✔ | Create a job (contact needs at least one of name/email/phone) |
| `/api/jobs/[id]` | DELETE | ✔ | Delete one of your own jobs |
| `/api/uploads` | POST | ✔ | Upload a JD attachment to Supabase (multipart `file`) |
| `/api/auth/register` | POST | — | Create account + sign in |
| `/api/auth/login` | POST | — | Sign in |
| `/api/auth/logout` | POST | — | Sign out |
| `/api/auth/me` | GET | — | Current recruiter |
| `/api/auth/forgot-password` | POST | — | Email a reset link (valid 1 hour, single use) |
| `/api/auth/reset-password` | POST | — | Set a new password with the token |

## Code map

- `lib/repository.ts` — all data access (MongoDB, or in-memory in dev)
- `lib/auth/` — password hashing, session cookie, current recruiter
- `lib/mail.ts` — Gmail SMTP emails
- `lib/supabase.ts` — attachment uploads
- `lib/data/filterHierarchy.ts` — locations, profiles, industry → sub-role → tags
