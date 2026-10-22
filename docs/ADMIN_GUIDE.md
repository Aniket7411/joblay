# Admin Guide

How to run Joblay day to day. No coding needed except where marked **(developer)**.

## Signing in

Go to `/login` and sign in with your admin email and password. Admins land on the **Admin Panel** (`/admin`). The panel is invisible to everyone else — non-admins get "Page not found".

Admins can also post jobs like any recruiter (**Post a Job** button).

## The Admin Panel

### Overview
Headline numbers (live jobs, employers, suspended accounts, open messages), charts of jobs by industry and location, and the newest jobs and employers. Click a number to jump to its tab.

### Jobs
Every job on the site, including closed and expired ones.
- **Search** by title, company, skills, contact details or employer; **filter** by industry and location.
- Click a job to see everything: description, requirements, skills, contact details, attachment, employer, dates and status.
- **Edit** any job (for example, to fix a typo or remove inappropriate text).
- **Delete** removes a job permanently.

### Employers
Every recruiter and admin account, with company, number of jobs, join date and last login. Click an account to see its jobs.

| Action | What happens | Use it when |
|---|---|---|
| **Suspend** | They can't sign in, are signed out immediately, and all their jobs disappear from the site. Fully reversible | A report needs investigating, or an account looks suspicious |
| **Reactivate** | Undoes a suspension; their jobs reappear | The issue is resolved |
| **Reset password** | Emails them a reset link valid for 1 hour | They're locked out and contact you |
| **Make admin / Remove admin** | Gives or removes full access to this panel | Adding a teammate |
| **Delete** | Permanently deletes the account **and all its jobs** | Confirmed scam or spam. Prefer Suspend if unsure |

You can't suspend, demote or delete your own account, and admin accounts can't be deleted from the panel.

### Messages
Everything sent through the Contact page, including **job reports** (highlighted) and **bulk hiring enquiries** from the popup (green). Each message is also emailed to the site inbox. A bulk hiring enquiry lists the company, phone number, number of people to hire, city and any notes.
- **Reply** opens your email app addressed to the sender.
- **Resolve** marks it done (filter by Open / Resolved). **Delete** removes it.

### Categories
Add new **industries**, **roles** (under an industry) and **skills** (under a role) without a developer. Pick what to add, choose its parent, type the name and press **Add**. It shows up immediately in the candidate filters, the Post a Job form and AI auto-fill. The form lists what already exists, so you can check for near-duplicates first.

- Names are 2-60 characters and can't contain commas.
- The list on the right shows only what admins added, with how many jobs use each one. **Remove** deletes it plus anything added under it. Jobs already using it stay live, but candidates can no longer filter by it.
- The built-in industries can't be removed here **(developer: `lib/data/filterHierarchy.ts`)**.

### Popup
A **bulk hiring popup** that asks employers hiring many people to leave their details. It's **off** until you switch it on.
- **The switch** turns it on or off for all visitors immediately.
- Edit the **title**, **message** and **how many seconds** visitors spend on a page before it appears, then **Save changes**. **Preview** shows exactly what visitors will see (nothing is sent from the preview).
- It never appears on the admin, dashboard, sign-in or contact pages.
- A visitor who closes it won't see it again for 3 days, or 30 days after sending an enquiry. Saving changes (or switching it on again) shows it again to everyone.

### Download Excel
One file with four sheets: **Summary** (totals and breakdowns), **Jobs** (every field), **Employers**, **Messages**. Opens in Excel or Google Sheets.

## Handling a job report

Candidates report jobs from the job page ("Report this job"); the message arrives pre-filled with the job's title and ID.

1. Open **Messages**, read the report, then open the job in **Jobs** (search the title).
2. Clear-cut fraud (asks candidates for money, fake company): **Suspend** the employer, which hides all their jobs at once. Delete later if confirmed.
3. A single problem listing: **Edit** it or **Delete** it.
4. **Reply** to the reporter if useful, then **Resolve** the message.

Joblay's rule, shown to candidates: a genuine employer never asks for money. Any listing asking for fees, deposits or "registration charges" should be removed.

## Admin accounts **(developer)**

Admins can't reset their password by email, because admin addresses may not be real inboxes. Create an admin, or set a new password for one, from the project folder:

```bash
npm run create-admin -- someone@example.com "StrongPass123" "Their Name"
```

Running it again for an existing account sets a new password (and makes the account an admin). Passwords need 8+ characters with uppercase, lowercase and a number.

To promote an existing recruiter instead, use **Make admin** in the Employers tab.

## Keeping the site healthy

- **Listings expire after 30 days.** Recruiters see "Live · N days left" and can renew with one click. Expired jobs disappear from search automatically.
- **Bot protection and blocked throwaway emails** reduce spam sign-ups (bot protection needs its key set — see [SETUP.md](SETUP.md)).
- **Check the status panel** in the server logs after each deploy; anything marked ❌ needs fixing (see Troubleshooting in [SETUP.md](SETUP.md)).
