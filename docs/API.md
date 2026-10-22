# API Reference

Joblay's HTTP API is JSON over HTTPS on the same domain as the site, e.g. `https://yourdomain.com/api/jobs`.

## Conventions

Every response has the same envelope:

```json
{ "success": true, "message": "Jobs fetched", "data": { } }
```

On failure, `success` is `false` and `message` is safe to show to users. Validation failures add `errors`, keyed by field:

```json
{ "success": false, "message": "Validation failed", "errors": { "salaryMax": ["Max salary must be at least the minimum"] } }
```

| Status | Meaning |
|---|---|
| 200 / 201 | OK / created |
| 400 | Invalid input (see `errors`) |
| 401 | Not signed in |
| 403 | Signed in but not allowed (e.g. not an admin) |
| 404 | Not found, or not yours |
| 409 | Conflict (email already registered) |
| 429 | Rate limited |
| 503 | Temporarily unavailable (database being upgraded, or an optional service not configured) |

## Public job search

### `GET /api/jobs`

No authentication. Returns live jobs only (active, not expired, employer not suspended). Responses are cacheable for 30 seconds.

All parameters are optional. Multi-value parameters take comma-separated values. Unknown values are ignored rather than rejected.

| Parameter | Example | Meaning |
|---|---|---|
| `q` | `react native` | Keywords. Every word must appear in the title, company, skills, location, role or description |
| `location` | `Pune,Mumbai` | Cities. `Pan India` = anywhere in India |
| `industry` | `IT` | Industries |
| `subRole` | `Developer,Tester` | Roles within the industry |
| `tags` | `Java Developer,React Developer` | Skills (a job matches if it has **any** of them) |
| `jobProfile` | `Fresher,Junior` | Seniority |
| `workMode` | `Remote,Hybrid` | `Office`, `Remote`, `Hybrid` |
| `jobType` | `Full-time,Internship` | `Full-time`, `Part-time`, `Contract`, `Internship`, `Freelance`, `Temporary` |
| `education` | `Graduate` | Minimum education required |
| `experience` | `3` | The candidate's years of experience; returns jobs whose range includes it (0–30) |
| `salary` | `6` | Minimum salary in **lakhs per annum**; jobs without a disclosed salary are excluded |
| `postedWithin` | `7` | Days: `1`, `3`, `7`, `15` or `30` |
| `hasPhone` / `hasEmail` | `1` | Only jobs with that contact method |
| `sort` | `salary` | `newest` (default), `salary` (highest first), `experience` (least first) |
| `page` | `2` | Returns the first `page × 20` results (max page 25) |

The allowed values for locations, industries, roles and skills are defined in [`lib/data/filterHierarchy.ts`](../lib/data/filterHierarchy.ts), plus any industries, roles and skills admins add in Admin Panel → Categories.

The same parameters work on the website, e.g. `https://yourdomain.com/?workMode=Remote&tags=AWS&salary=10`.

**Example**

```http
GET /api/jobs?location=Pune&experience=2&salary=5&sort=salary
```

```json
{
  "success": true,
  "message": "Jobs fetched",
  "data": {
    "jobs": [
      {
        "id": "38153590-3e90-4bb1-af70-647880f393ef",
        "recruiterId": "d24894b2-e9ff-48cb-81dc-e3a5213ea99f",
        "title": "React Developer",
        "company": "Acme Tech",
        "location": "Pune",
        "jobProfile": "Junior",
        "industry": "IT",
        "subRole": "Developer",
        "tags": ["React Developer"],
        "workMode": "Hybrid",
        "jobType": "Full-time",
        "experienceMin": 1,
        "experienceMax": 3,
        "salaryMin": 5,
        "salaryMax": 8,
        "education": "Graduate",
        "openings": 2,
        "description": "Build web dashboards with React and TypeScript.",
        "criteria": ["React basics", "Git"],
        "contact": { "email": "hr@acme.example", "phone": "+919876543210" },
        "status": "active",
        "expiresAt": "2026-11-13T09:00:00.000Z",
        "createdAt": "2026-10-14T09:00:00.000Z",
        "updatedAt": "2026-10-14T09:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20,
    "hasMore": false
  }
}
```

### The job object

| Field | Type | Notes |
|---|---|---|
| `id`, `recruiterId` | string (UUID) | |
| `title`, `company`, `description` | string | |
| `location`, `industry`, `subRole`, `jobProfile` | string | From the taxonomy |
| `tags` | string[] | Skills |
| `workMode`, `jobType`, `education` | string | See values above |
| `experienceMin`, `experienceMax` | integer | Years. `experienceMax` of 30 means "no upper limit" |
| `salaryMin`, `salaryMax` | number or absent | Lakhs per annum. Absent = not disclosed |
| `openings` | integer | |
| `urgent` | boolean | Shows an "Urgent" badge. Optional on create/edit (default `false`) |
| `criteria` | string[] | Requirements |
| `contact` | `{ name?, email?, phone? }` | At least one is present. Phone is in E.164 format (`+91…`) |
| `attachmentUrl` | string or absent | Public PDF/Word JD |
| `status` | `active` \| `closed` | |
| `expiresAt`, `createdAt`, `updatedAt` | ISO 8601 | |

Each job also has a public page at `/jobs/{id}`.

## Recruiter endpoints

Recruiter and admin endpoints use a session cookie. Sign in with `POST /api/auth/login`; the response sets an HTTP-only `joblay_session` cookie (valid 7 days). Send it back with each request (`credentials: "include"` in browsers, a cookie jar elsewhere).

### `POST /api/jobs` — create a job
### `PATCH /api/jobs/{id}` — edit a job (owner, or any job for admins)

Body (numbers may be sent as numbers or strings):

```json
{
  "title": "React Developer",
  "company": "Acme Tech",
  "location": "Pune",
  "jobProfile": "Junior",
  "industry": "IT",
  "subRole": "Developer",
  "tags": ["React Developer"],
  "workMode": "Hybrid",
  "jobType": "Full-time",
  "education": "Graduate",
  "experienceMin": 1,
  "experienceMax": 3,
  "salaryMin": 5,
  "salaryMax": 8,
  "openings": 2,
  "description": "At least 20 characters…",
  "criteria": "One requirement per line\nAnother requirement",
  "contactName": "Priya",
  "contactEmail": "hr@acme.example",
  "contactPhone": "98765 43210",
  "attachmentUrl": ""
}
```

Rules:
- `location`, `industry`, `subRole`, `tags` and `jobProfile` must come from the taxonomy; `tags` must belong to the chosen `subRole`.
- At least one of `contactName`, `contactEmail`, `contactPhone`. Phone numbers are validated and stored as `+91…`.
- `experienceMax ≥ experienceMin`. `salaryMax ≥ salaryMin`; send only `salaryMin` for a fixed figure; omit both for "not disclosed".
- New jobs are live for 30 days.

### `DELETE /api/jobs/{id}` — delete your own job

### `POST /api/jobs/{id}/status` — close, reopen or renew

```json
{ "action": "close" }
```
`close` hides the job; `reopen` and `renew` make it live for another 30 days. Owners, or admins for any job.

### `POST /api/jobs/{id}/stats` — count a view or contact tap
Public. Body `{ "kind": "view" }` or `{ "kind": "contact" }`. The site sends each at most once per job per browser session; the totals appear on the recruiter dashboard.

### `GET /api/jobs/saved?ids=a,b` — saved jobs
Public. The still-live jobs among up to 100 comma-separated ids (saved jobs are kept in the visitor's browser).

### `POST /api/uploads` — upload a JD attachment
Multipart form with a `file` field: PDF, DOC or DOCX up to 5 MB. Returns `{ "url": "…" }` to send as `attachmentUrl`. Needs Supabase Storage.

### `POST /api/ai/parse-jd` — auto-fill from a job description
Body `{ "text": "…full job description…" }` (80–12,000 characters). Returns suggested job fields in the same shape as the create body (only fields it could read). Needs `GEMINI_API_KEY`; 15 requests per recruiter per hour.

## Accounts

| Endpoint | Body | Notes |
|---|---|---|
| `POST /api/auth/register` | `name`, `email`, `password`, `confirmPassword`, `company?` | Signs in on success. Throwaway email domains are rejected |
| `POST /api/auth/login` | `email`, `password` | Suspended accounts get 403 |
| `POST /api/auth/logout` | — | |
| `POST /api/auth/forgot-password` | `email` | Always succeeds (doesn't reveal whether the account exists). Link valid 1 hour |
| `POST /api/auth/reset-password` | `token`, `password`, `confirmPassword` | Token is single-use |

Passwords: 8+ characters with uppercase, lowercase and a number.

When Cloudflare Turnstile is enabled, `register`, `login`, `forgot-password` and `contact` also require a `turnstileToken` field from the Turnstile widget.

## Contact

`POST /api/contact` — `name`, `email`, `topic` (`general`, `report`, `recruiter`, `privacy`, `bulk`), `message`. Limited to 5 messages per IP per 10 minutes. The bulk hiring popup sends `topic: "bulk"`.

`GET /api/popup` — the bulk hiring popup: `{ enabled, title, message, delaySeconds, updatedAt }` while an admin has it on, otherwise `{ enabled: false }`.

## Admin endpoints

Admin session required. Used by the admin panel; available for internal tools.

| Endpoint | Purpose |
|---|---|
| `DELETE /api/admin/jobs/{id}` | Delete any job |
| `PATCH /api/admin/recruiters/{id}` | `{ "status": "active" \| "suspended" }` and/or `{ "role": "recruiter" \| "admin" }` |
| `DELETE /api/admin/recruiters/{id}` | Delete a recruiter and all their jobs (not admins) |
| `POST /api/admin/recruiters/{id}/reset-password` | Email a reset link (needs email configured) |
| `PATCH /api/admin/messages/{id}` | `{ "status": "open" \| "resolved" }` |
| `DELETE /api/admin/messages/{id}` | Delete a message |
| `GET /api/admin/export` | Excel workbook (Summary, Jobs, Employers, Messages) |
| `PUT /api/admin/popup` | `{ enabled, title, message, delaySeconds }` — the bulk hiring popup |

## Other public URLs

| URL | Purpose |
|---|---|
| `/sitemap.xml` | Static pages and all live jobs (refreshed hourly) |
| `/robots.txt` | Crawl rules (admin, dashboard and API excluded) |
| `/jobs/{id}` | Job page with schema.org `JobPosting` data for Google for Jobs |
