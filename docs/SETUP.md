# Setup & Deployment

This guide covers every setting, where to get each key, how to run locally, how to deploy to Vercel, and how to fix common problems.

## How settings work

All settings are environment variables in `.env` (locally) or **Vercel → Project → Settings → Environment Variables** (production). `.env` is git-ignored; never commit it. After changing a setting, restart `npm run dev` or redeploy on Vercel.

Only Supabase is required. Everything else is optional: when a key is missing, its feature switches off (or falls back) and the rest of the site keeps working. The status panel printed on startup shows what is on:

```
  ✅ Supabase DB   xxxx.supabase.co · schema 0003 · 12 jobs
  ✅ Storage       bucket "jd-attachments" ready
  ✅ Email (SMTP)  signed in as you@gmail.com
  ⚠️  AI auto-fill  off — set GEMINI_API_KEY (free at aistudio.google.com)
```

✅ connected · ⚠️ optional feature off (fine) · ❌ needs fixing

## Settings reference

### Required

| Variable | What it's for | Where to get it |
|---|---|---|
| `SUPABASE_URL` | Database and file storage | Supabase → Project Settings → API Keys → Project URL |
| `SUPABASE_SECRET_KEY` | Server access to Supabase (bypasses row-level security — keep private) | Same page → **Secret key** (`sb_secret_…`). The legacy `SUPABASE_SERVICE_ROLE_KEY` also works |

Without these, local development uses in-memory demo data; production returns "service unavailable".

### Recommended

| Variable | What it's for | If missing |
|---|---|---|
| `SUPABASE_DB_URL` | Applies database migrations automatically before `dev` and `build` | Migrations are skipped; paste pending files from `supabase/migrations/` into the Supabase SQL Editor yourself |
| `EMAIL_USER`, `EMAIL_PASSWORD` | Gmail address + **App Password** for password resets, welcome emails, contact messages | Emails are printed to the server console instead |
| `NEXT_PUBLIC_APP_URL` | Public site address for email links, sitemap, search pings | Uses Vercel's production URL automatically, else `http://localhost:3000`. Set it when you use a custom domain |
| `AUTH_SECRET` | Signs login sessions | A key derived from `SUPABASE_SECRET_KEY` is used. Changing it later signs everyone out once |

### Optional

| Variable | Feature | If missing |
|---|---|---|
| `SUPABASE_STORAGE_BUCKET` | Bucket for JD attachments (default `jd-attachments`, created automatically) | Default name used |
| `SMTP_HOST`, `SMTP_PORT` | Mail server (default `smtp.gmail.com`, `465`) | Gmail defaults |
| `SMTP_FROM` | Sender shown on emails, e.g. `"Joblay <you@gmail.com>"` | `Joblay <EMAIL_USER>` |
| `CONTACT_TO_EMAIL` | Inbox for contact-form messages and job reports | `EMAIL_USER` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile bot check on register, login, contact, forgot password | No bot check |
| `GEMINI_API_KEY` | "Paste a JD → auto-fill" for recruiters | Auto-fill box hidden |
| `GEMINI_MODEL` | Gemini model (default `gemini-flash-latest`) | Default |
| `INDEXNOW_KEY` | Pings Bing, Yandex etc. when jobs change | No pings |
| `GOOGLE_INDEXING_CLIENT_EMAIL`, `GOOGLE_INDEXING_PRIVATE_KEY` | Pings Google's Indexing API when jobs change | No Google pings (Google still finds jobs via the sitemap) |

## Getting each key

### Supabase
1. Create a project at [supabase.com](https://supabase.com) (pick the Mumbai region for India).
2. **Project Settings → API Keys**: copy the Project URL → `SUPABASE_URL` and a **Secret key** → `SUPABASE_SECRET_KEY`.
3. **Connect → Session pooler** tab: copy the URI, fill in your database password → `SUPABASE_DB_URL`.
   - Use the **Session pooler** (host `…pooler.supabase.com`, port `5432`). The *Direct connection* (`db.…supabase.co`) is IPv6-only and won't connect from most networks or from Vercel. The *Transaction pooler* (port `6543`) doesn't support migrations.
   - Forgot the database password? Project Settings → Database → Reset database password.
4. Run `npm run dev` — tables, indexes, security rules and the storage bucket are created automatically.

### Gmail (email)
1. Turn on 2-Step Verification for the Gmail account.
2. Create an App Password at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
3. `EMAIL_USER` = the Gmail address; `EMAIL_PASSWORD` = the 16-character App Password (spaces are fine). Not your normal Gmail password.
4. Gmail allows roughly 500 emails per day. For more, switch to a provider such as Brevo or Resend by changing `SMTP_HOST`, `SMTP_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`.

### Cloudflare Turnstile (bot check)
1. [dash.cloudflare.com](https://dash.cloudflare.com) → Turnstile → Add widget.
2. Add your domain and `localhost` as hostnames; mode "Managed".
3. Copy the Site Key → `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, Secret Key → `TURNSTILE_SECRET_KEY`. Set both, or neither.

### Google Gemini (AI auto-fill)
1. [aistudio.google.com/apikey](https://aistudio.google.com/apikey) → Create API key → `GEMINI_API_KEY`.
2. The free tier has rate limits, and Google may use free-tier inputs to improve its models (recruiters are told this next to the button). Each recruiter can use auto-fill 15 times per hour.

### IndexNow (Bing and others)
Generate any random key and set it as `INDEXNOW_KEY`:
```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```
The site serves it at `/indexnow-key.txt` automatically. Pings only start once the site has a public URL.

### Google Indexing API (optional, after launch)
1. Google Cloud Console → create a project → enable the **Web Search Indexing API**.
2. Create a service account → Keys → Add key → JSON.
3. From the JSON: `client_email` → `GOOGLE_INDEXING_CLIENT_EMAIL`, `private_key` → `GOOGLE_INDEXING_PRIVATE_KEY` (keep the `\n` sequences; wrap in double quotes).
4. In Google Search Console, verify your domain and add the service account email as an **Owner**.

## Running locally

```bash
npm install
cp .env.example .env
npm run dev
```

Then create your first admin:
```bash
npm run create-admin -- you@yourcompany.com "StrongPass123" "Your Name"
```

## Deploying to Vercel

1. Push the repository to GitHub.
2. Vercel → Add New → Project → import the repository (framework is detected automatically).
3. Add the environment variables from the tables above. At minimum: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `SUPABASE_DB_URL`, `EMAIL_USER`, `EMAIL_PASSWORD`, and `AUTH_SECRET` (recommended for production).
4. Deploy. The build applies any pending database migrations first; if a migration fails, the deploy stops and the live site keeps running the previous version.
5. Add your domain under Settings → Domains, then set `NEXT_PUBLIC_APP_URL=https://yourdomain.com` and redeploy.
6. Check the deployment's runtime logs for the status panel.
7. Submit `https://yourdomain.com/sitemap.xml` in Google Search Console.

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `[db] … ENOTFOUND db.xxxx.supabase.co` | You used the Direct connection URL (IPv6-only). Use the Session pooler URI |
| `[db] Warning: port 6543 is the transaction pooler` | Use the Session pooler URI (port 5432) |
| Status panel: `schema untracked/0002, app needs 0003` | Migrations haven't run. Set `SUPABASE_DB_URL` and restart, or run `npm run db:migrate`, or paste the pending files from `supabase/migrations/` into the SQL Editor |
| Home page says "We're updating Joblay" | Same as above — the database is behind the code |
| Email (SMTP) ❌ "Invalid login" | Use a Gmail App Password, not your account password; check 2-Step Verification is on |
| Password-reset emails not arriving | Check Spam; check the status panel shows Email ✅; admin accounts can't reset by email (use `create-admin`) |
| Turnstile widget shows an error | Add the current hostname (including `localhost`) to the widget in Cloudflare |
| AI auto-fill: "free AI quota is used up" | Gemini free-tier rate limit; wait a minute |
| Login works locally but not in production | Make sure the site is served over HTTPS (session cookies are `Secure` in production) |
| `npm run dev` says another dev server is running | Only one dev server per project folder; stop the other one |
