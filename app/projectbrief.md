# Joblay — Project Brief

## Overview

**Joblay** is a crisp, minimalist job board platform. Candidates browse and contact recruiters directly — no candidate accounts. Recruiters authenticate to post and manage job descriptions (JDs).

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4, Framer Motion, Lucide React |
| Forms | React Hook Form + Zod |
| Database | MongoDB via Mongoose (schemas ready, mock mode until `.env`) |
| Storage | Supabase Storage (placeholder) |
| Auth & Mail | Email/password + SMTP reset flow (placeholder) |

## User Flows

### Candidate (no auth)
- Browse jobs on `/`
- Filter by Location, Job Profile, Industry
- Dynamic subfilters when Industry is selected (e.g. IT → Developer, Tester, SAP)
- Multi-select niche tags under subfilters
- Contact recruiters via **Number** (call/WhatsApp) or **Email** (mailto/copy)

### Recruiter (authenticated)
- Register / Sign in at `/register`, `/login`
- Forgot password at `/forgot-password` → SMTP reset link
- Dashboard at `/dashboard` — view and delete past JDs
- Post new JD at `/dashboard/post`
- Contact validation: at least one of Name, Email, or Phone required

## Pages

| Route | Description |
|-------|-------------|
| `/` | Hero + Filter Bar + Job Grid |
| `/login` | Recruiter sign in |
| `/register` | Recruiter registration |
| `/forgot-password` | Request password reset |
| `/reset-password` | Set new password |
| `/dashboard` | Recruiter JD management |
| `/dashboard/post` | Post new job |

## Demo Credentials

- Email: `recruiter@demo.com`
- Password: `Demo@1234`

## API Routes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/jobs` | GET, POST | List/filter jobs, create job |
| `/api/jobs/[id]` | DELETE | Delete recruiter's job |
| `/api/auth/login` | POST | Recruiter sign in |
| `/api/auth/register` | POST | Recruiter registration |
| `/api/auth/forgot-password` | POST | Send reset email |
| `/api/auth/reset-password` | POST | Reset password |

## Setup

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` when connecting MongoDB, Supabase, and SMTP.
