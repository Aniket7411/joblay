import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { mockStore } from "@/lib/data/mockStore";
import { hashToken } from "@/lib/auth/password";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { PAGE_SIZE, type JobQuery } from "@/lib/jobQuery";
import type {
  AccountStatus,
  ContactMessage,
  JobPage,
  JobPosting,
  JobStatus,
  Recruiter,
  RecruiterSummary,
  UserRole,
} from "@/types";

/**
 * Single data-access layer. Uses Supabase Postgres when SUPABASE_URL and
 * SUPABASE_SECRET_KEY are set, otherwise an in-memory store (local dev only —
 * production requires Supabase). Schema: supabase/migrations/
 */

export class DatabaseUnavailableError extends Error {
  constructor() {
    super("Database is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY.");
  }
}

/**
 * The database is reachable but older than this code (a migration hasn't
 * been applied yet). Shown to users as "being updated", never as a crash.
 */
export class SchemaOutdatedError extends Error {
  constructor(detail: string) {
    super(`Database schema is out of date — run \`npm run db:migrate\`. (${detail})`);
  }
}

// Postgres / PostgREST codes for a missing table or column.
const SCHEMA_ERROR_CODES = new Set(["42703", "42P01", "PGRST204", "PGRST205"]);

/** Normalizes a Supabase error, flagging schema-version problems. */
function dbError(error: { code?: string; message: string }): Error {
  if (error.code && SCHEMA_ERROR_CODES.has(error.code)) return new SchemaOutdatedError(error.message);
  return Object.assign(new Error(error.message), error);
}

/** Supabase client, or null to use the in-memory dev store. */
function db(): SupabaseClient | null {
  if (isSupabaseConfigured()) return getSupabase();
  if (process.env.NODE_ENV === "production") {
    throw new DatabaseUnavailableError();
  }
  return null;
}

export interface RecruiterWithHash extends Recruiter {
  passwordHash: string;
}

/** What a recruiter submits; status and expiry are managed separately. */
export type JobInput = Omit<
  JobPosting,
  "id" | "createdAt" | "updatedAt" | "recruiterId" | "status" | "expiresAt"
>;

export type JobAction = "close" | "reopen" | "renew";

const JOB_TTL_MS = 30 * 24 * 60 * 60 * 1000; // listings expire after 30 days
const newExpiry = () => new Date(Date.now() + JOB_TTL_MS).toISOString();
type NewJob = JobInput & { recruiterId: string };

/* ------------------------------------------------------------------ */
/* Row mapping (snake_case table columns ↔ app types)                  */
/* ------------------------------------------------------------------ */

interface RecruiterRow {
  id: string;
  name: string;
  email: string;
  company: string | null;
  role: UserRole;
  status: AccountStatus;
  last_login_at: string | null;
  password_hash: string;
  created_at: string;
}

interface JobRow {
  id: string;
  recruiter_id: string;
  title: string;
  company: string;
  location: string;
  job_profile: string;
  industry: string;
  sub_role: string;
  tags: string[];
  description: string;
  criteria: string[];
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  attachment_url: string | null;
  work_mode: string;
  job_type: string;
  experience_min: number;
  experience_max: number;
  salary_min: number | string | null;
  salary_max: number | string | null;
  education: string;
  openings: number;
  status: JobStatus;
  expires_at: string;
  created_at: string;
  updated_at: string | null;
}

interface MessageRow {
  id: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  status: "open" | "resolved";
  created_at: string;
}

const RECRUITER_PUBLIC_COLUMNS =
  "id, name, email, company, role, status, last_login_at, created_at";
const RECRUITER_COLUMNS = `${RECRUITER_PUBLIC_COLUMNS}, password_hash`;
const JOB_COLUMNS =
  "id, recruiter_id, title, company, location, job_profile, industry, sub_role, tags, description, criteria, contact_name, contact_email, contact_phone, attachment_url, work_mode, job_type, experience_min, experience_max, salary_min, salary_max, education, openings, status, expires_at, created_at, updated_at";

const iso = (v: string | null | undefined) =>
  v ? new Date(v).toISOString() : undefined;

function toPublicRecruiter(row: Omit<RecruiterRow, "password_hash">): Recruiter {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    company: row.company ?? undefined,
    role: row.role ?? "recruiter",
    status: row.status ?? "active",
    lastLoginAt: iso(row.last_login_at),
    createdAt: new Date(row.created_at).toISOString(),
  };
}

function toRecruiter(row: RecruiterRow): RecruiterWithHash {
  return { ...toPublicRecruiter(row), passwordHash: row.password_hash };
}

function toJob(row: JobRow): JobPosting {
  return {
    id: row.id,
    recruiterId: row.recruiter_id,
    title: row.title,
    company: row.company,
    location: row.location,
    jobProfile: row.job_profile,
    industry: row.industry,
    subRole: row.sub_role,
    tags: row.tags ?? [],
    description: row.description,
    criteria: row.criteria ?? [],
    contact: {
      name: row.contact_name ?? undefined,
      email: row.contact_email ?? undefined,
      phone: row.contact_phone ?? undefined,
    },
    attachmentUrl: row.attachment_url ?? undefined,
    workMode: row.work_mode,
    jobType: row.job_type,
    experienceMin: row.experience_min,
    experienceMax: row.experience_max,
    // numeric columns can arrive as strings
    salaryMin: row.salary_min === null ? undefined : Number(row.salary_min),
    salaryMax: row.salary_max === null ? undefined : Number(row.salary_max),
    education: row.education,
    openings: row.openings,
    status: row.status,
    expiresAt: new Date(row.expires_at).toISOString(),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: iso(row.updated_at),
  };
}

function jobToRow(input: JobInput) {
  return {
    title: input.title,
    company: input.company,
    location: input.location,
    job_profile: input.jobProfile,
    industry: input.industry,
    sub_role: input.subRole,
    tags: input.tags,
    description: input.description,
    criteria: input.criteria,
    contact_name: input.contact.name ?? null,
    contact_email: input.contact.email ?? null,
    contact_phone: input.contact.phone ?? null,
    attachment_url: input.attachmentUrl ?? null,
    work_mode: input.workMode,
    job_type: input.jobType,
    experience_min: input.experienceMin,
    experience_max: input.experienceMax,
    salary_min: input.salaryMin ?? null,
    salary_max: input.salaryMax ?? null,
    education: input.education,
    openings: input.openings,
  };
}

function toMessage(row: MessageRow): ContactMessage {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    topic: row.topic,
    message: row.message,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export function publicRecruiter(r: RecruiterWithHash): Recruiter {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...rest } = r;
  return rest;
}

function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/** Postgres unique-violation, e.g. a concurrent registration. */
export function isDuplicateError(err: unknown): boolean {
  return (err as { code?: string })?.code === "23505";
}

function mockRecruiter(id: string) {
  return mockStore.recruiters.find((r) => r.id === id);
}

/* ------------------------------------------------------------------ */
/* Recruiters                                                          */
/* ------------------------------------------------------------------ */

export async function findRecruiterByEmail(
  email: string
): Promise<RecruiterWithHash | null> {
  const normalized = email.trim().toLowerCase();
  const sb = db();
  if (sb) {
    const { data, error } = await sb
      .from("recruiters")
      .select(RECRUITER_COLUMNS)
      .eq("email", normalized)
      .maybeSingle<RecruiterRow>();
    if (error) throw dbError(error);
    return data ? toRecruiter(data) : null;
  }
  return mockStore.recruiters.find((r) => r.email === normalized) ?? null;
}

export async function findRecruiterById(
  id: string
): Promise<RecruiterWithHash | null> {
  const sb = db();
  if (sb) {
    if (!isUuid(id)) return null;
    const { data, error } = await sb
      .from("recruiters")
      .select(RECRUITER_COLUMNS)
      .eq("id", id)
      .maybeSingle<RecruiterRow>();
    if (error) throw dbError(error);
    return data ? toRecruiter(data) : null;
  }
  return mockRecruiter(id) ?? null;
}

export async function createRecruiter(input: {
  name: string;
  email: string;
  company?: string;
  passwordHash: string;
}): Promise<RecruiterWithHash> {
  const email = input.email.trim().toLowerCase();
  const sb = db();
  if (sb) {
    const { data, error } = await sb
      .from("recruiters")
      .insert({
        name: input.name,
        email,
        company: input.company ?? null,
        password_hash: input.passwordHash,
        last_login_at: new Date().toISOString(),
      })
      .select(RECRUITER_COLUMNS)
      .single<RecruiterRow>();
    if (error) throw dbError(error);
    return toRecruiter(data);
  }
  const recruiter = {
    id: `rec-${randomUUID().slice(0, 8)}`,
    name: input.name,
    email,
    company: input.company,
    role: "recruiter" as const,
    status: "active" as const,
    lastLoginAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    passwordHash: input.passwordHash,
  };
  mockStore.recruiters.push(recruiter);
  return recruiter;
}

/** Records a successful sign-in (best effort). */
export async function recordLogin(id: string): Promise<void> {
  const now = new Date().toISOString();
  const sb = db();
  if (sb) {
    const { error } = await sb.from("recruiters").update({ last_login_at: now }).eq("id", id);
    if (error) console.error("[recordLogin]", error.message);
    return;
  }
  const r = mockRecruiter(id);
  if (r) r.lastLoginAt = now;
}

export async function setResetToken(
  recruiterId: string,
  tokenHash: string,
  expires: Date
): Promise<void> {
  const sb = db();
  if (sb) {
    const { error } = await sb
      .from("recruiters")
      .update({
        reset_token_hash: tokenHash,
        reset_token_expires: expires.toISOString(),
      })
      .eq("id", recruiterId);
    if (error) throw dbError(error);
    return;
  }
  const r = mockRecruiter(recruiterId);
  if (r) {
    r.resetTokenHash = tokenHash;
    r.resetTokenExpires = expires.getTime();
  }
}

/** Consumes a valid reset token (single use) and sets the new password hash. */
export async function resetPasswordWithToken(
  token: string,
  passwordHash: string
): Promise<boolean> {
  const tokenHash = hashToken(token);
  const sb = db();
  if (sb) {
    const { data, error } = await sb
      .from("recruiters")
      .update({
        password_hash: passwordHash,
        reset_token_hash: null,
        reset_token_expires: null,
      })
      .eq("reset_token_hash", tokenHash)
      .gt("reset_token_expires", new Date().toISOString())
      .select("id");
    if (error) throw dbError(error);
    return data.length === 1;
  }
  const r = mockStore.recruiters.find(
    (x) =>
      x.resetTokenHash === tokenHash &&
      (x.resetTokenExpires ?? 0) > Date.now()
  );
  if (!r) return false;
  r.passwordHash = passwordHash;
  r.resetTokenHash = undefined;
  r.resetTokenExpires = undefined;
  return true;
}

/* ------------------------------------------------------------------ */
/* Jobs                                                                */
/* ------------------------------------------------------------------ */

/** Splits a keyword query into lower-cased words safe for LIKE patterns. */
function searchWords(q: string): string[] {
  return q
    .toLowerCase()
    .replace(/[%_\\]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8);
}

/** In-memory equivalent of the public search filters (dev store). */
function matchesQuery(j: JobPosting, q: JobQuery, now: number): boolean {
  const anyOf = (selected: string[], value: string) => !selected.length || selected.includes(value);
  if (j.status !== "active" || new Date(j.expiresAt).getTime() <= now) return false;
  if (mockRecruiter(j.recruiterId)?.status === "suspended") return false;
  if (!anyOf(q.location, j.location) || !anyOf(q.industry, j.industry)) return false;
  if (!anyOf(q.subRole, j.subRole) || !anyOf(q.jobProfile, j.jobProfile)) return false;
  if (!anyOf(q.workMode, j.workMode) || !anyOf(q.jobType, j.jobType)) return false;
  if (!anyOf(q.education, j.education)) return false;
  if (q.tags.length && !q.tags.some((t) => j.tags.includes(t))) return false;
  if (q.experience !== undefined && (j.experienceMin > q.experience || j.experienceMax < q.experience)) return false;
  if (q.salary !== undefined && (j.salaryMax === undefined || j.salaryMax < q.salary)) return false;
  if (q.postedWithin !== undefined && new Date(j.createdAt).getTime() < now - q.postedWithin * 86_400_000) return false;
  if (q.hasPhone && !j.contact.phone) return false;
  if (q.hasEmail && !j.contact.email) return false;
  const words = searchWords(q.q);
  if (words.length) {
    const text = [j.title, j.company, j.location, j.industry, j.subRole, j.jobProfile, j.workMode, j.jobType, ...j.tags, j.description]
      .join(" ")
      .toLowerCase();
    if (!words.every((w) => text.includes(w))) return false;
  }
  return true;
}

/**
 * Public job search: live jobs only (active, not expired, employer active),
 * every filter applied in the database, newest/salary/experience sorting,
 * and "load more" paging (returns the first page × PAGE_SIZE results).
 */
export async function searchJobs(q: JobQuery): Promise<JobPage> {
  const limit = q.page * PAGE_SIZE;
  const sb = db();
  if (sb) {
    const now = new Date().toISOString();
    let query = sb
      .from("jobs")
      .select(`${JOB_COLUMNS}, recruiters!inner(status)`, { count: "exact" })
      .eq("status", "active")
      .gt("expires_at", now)
      .eq("recruiters.status", "active");

    if (q.location.length) query = query.in("location", q.location);
    if (q.industry.length) query = query.in("industry", q.industry);
    if (q.subRole.length) query = query.in("sub_role", q.subRole);
    if (q.tags.length) query = query.overlaps("tags", q.tags);
    if (q.jobProfile.length) query = query.in("job_profile", q.jobProfile);
    if (q.workMode.length) query = query.in("work_mode", q.workMode);
    if (q.jobType.length) query = query.in("job_type", q.jobType);
    if (q.education.length) query = query.in("education", q.education);
    if (q.experience !== undefined) {
      query = query.lte("experience_min", q.experience).gte("experience_max", q.experience);
    }
    if (q.salary !== undefined) query = query.gte("salary_max", q.salary);
    if (q.postedWithin !== undefined) {
      query = query.gte("created_at", new Date(Date.now() - q.postedWithin * 86_400_000).toISOString());
    }
    if (q.hasPhone) query = query.not("contact_phone", "is", null);
    if (q.hasEmail) query = query.not("contact_email", "is", null);
    for (const word of searchWords(q.q)) query = query.ilike("search_text", `%${word}%`);

    if (q.sort === "salary") {
      query = query.order("salary_max", { ascending: false, nullsFirst: false });
    } else if (q.sort === "experience") {
      query = query.order("experience_min", { ascending: true });
    }
    query = query.order("created_at", { ascending: false }).range(0, limit - 1);

    const { data, error, count } = await query.returns<JobRow[]>();
    if (error) throw dbError(error);
    const total = count ?? data.length;
    return { jobs: data.map(toJob), total, page: q.page, pageSize: PAGE_SIZE, hasMore: total > limit };
  }

  const now = Date.now();
  const matched = mockStore.jobs.filter((j) => matchesQuery(j, q, now));
  matched.sort((a, b) => {
    if (q.sort === "salary") {
      const d = (b.salaryMax ?? -1) - (a.salaryMax ?? -1);
      if (d) return d;
    } else if (q.sort === "experience") {
      const d = a.experienceMin - b.experienceMin;
      if (d) return d;
    }
    return b.createdAt.localeCompare(a.createdAt);
  });
  return {
    jobs: matched.slice(0, limit),
    total: matched.length,
    page: q.page,
    pageSize: PAGE_SIZE,
    hasMore: matched.length > limit,
  };
}

/**
 * Every job (any status), newest first — for the recruiter dashboard
 * (pass recruiterId), the admin panel and the Excel export.
 */
export async function listJobs(opts: { recruiterId?: string } = {}): Promise<JobPosting[]> {
  const sb = db();
  if (sb) {
    let query = sb
      .from("jobs")
      .select(JOB_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(5000);
    if (opts.recruiterId) {
      if (!isUuid(opts.recruiterId)) return [];
      query = query.eq("recruiter_id", opts.recruiterId);
    }
    const { data, error } = await query.returns<JobRow[]>();
    if (error) throw dbError(error);
    return data.map(toJob);
  }
  return [...mockStore.jobs]
    .filter((j) => !opts.recruiterId || j.recruiterId === opts.recruiterId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** True if the job is visible on the public board right now. */
export function isJobLive(job: JobPosting, now = Date.now()): boolean {
  return job.status === "active" && new Date(job.expiresAt).getTime() > now;
}

export async function getJobById(id: string): Promise<JobPosting | null> {
  const sb = db();
  if (sb) {
    if (!isUuid(id)) return null;
    const { data, error } = await sb
      .from("jobs")
      .select(JOB_COLUMNS)
      .eq("id", id)
      .maybeSingle<JobRow>();
    if (error) throw dbError(error);
    return data ? toJob(data) : null;
  }
  return mockStore.jobs.find((j) => j.id === id) ?? null;
}

export async function createJob(input: NewJob): Promise<JobPosting> {
  const sb = db();
  if (sb) {
    const { data, error } = await sb
      .from("jobs")
      .insert({ ...jobToRow(input), recruiter_id: input.recruiterId, expires_at: newExpiry() })
      .select(JOB_COLUMNS)
      .single<JobRow>();
    if (error) throw dbError(error);
    return toJob(data);
  }
  const now = new Date().toISOString();
  const job: JobPosting = {
    ...input,
    id: `job-${randomUUID().slice(0, 8)}`,
    status: "active",
    expiresAt: newExpiry(),
    createdAt: now,
    updatedAt: now,
  };
  mockStore.jobs.unshift(job);
  return job;
}

/**
 * Updates a job. Pass the owner's id to restrict the update to their own job,
 * or null for an admin edit of any job.
 */
export async function updateJob(
  id: string,
  input: JobInput,
  ownerId: string | null
): Promise<JobPosting | null> {
  const sb = db();
  if (sb) {
    if (!isUuid(id)) return null;
    let query = sb
      .from("jobs")
      .update({ ...jobToRow(input), updated_at: new Date().toISOString() })
      .eq("id", id);
    if (ownerId) query = query.eq("recruiter_id", ownerId);
    const { data, error } = await query.select(JOB_COLUMNS).maybeSingle<JobRow>();
    if (error) throw dbError(error);
    return data ? toJob(data) : null;
  }
  const job = mockStore.jobs.find(
    (j) => j.id === id && (!ownerId || j.recruiterId === ownerId)
  );
  if (!job) return null;
  Object.assign(job, input, { updatedAt: new Date().toISOString() });
  return job;
}

/**
 * Close, reopen or renew a job (renew/reopen also extend it 30 days).
 * Pass the owner's id to restrict to their own job, or null for admins.
 */
export async function setJobStatus(
  id: string,
  action: JobAction,
  ownerId: string | null
): Promise<JobPosting | null> {
  const patch =
    action === "close"
      ? { status: "closed" as const }
      : { status: "active" as const, expiresAt: newExpiry() };
  const sb = db();
  if (sb) {
    if (!isUuid(id)) return null;
    let query = sb
      .from("jobs")
      .update({
        status: patch.status,
        ...("expiresAt" in patch ? { expires_at: patch.expiresAt } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (ownerId) query = query.eq("recruiter_id", ownerId);
    const { data, error } = await query.select(JOB_COLUMNS).maybeSingle<JobRow>();
    if (error) throw dbError(error);
    return data ? toJob(data) : null;
  }
  const job = mockStore.jobs.find((j) => j.id === id && (!ownerId || j.recruiterId === ownerId));
  if (!job) return null;
  Object.assign(job, patch, { updatedAt: new Date().toISOString() });
  return job;
}

/** Deletes a job only if it belongs to the recruiter. */
export async function deleteJob(
  id: string,
  recruiterId: string
): Promise<boolean> {
  const sb = db();
  if (sb) {
    if (!isUuid(id) || !isUuid(recruiterId)) return false;
    const { data, error } = await sb
      .from("jobs")
      .delete()
      .eq("id", id)
      .eq("recruiter_id", recruiterId)
      .select("id");
    if (error) throw dbError(error);
    return data.length === 1;
  }
  const idx = mockStore.jobs.findIndex(
    (j) => j.id === id && j.recruiterId === recruiterId
  );
  if (idx === -1) return false;
  mockStore.jobs.splice(idx, 1);
  return true;
}

/* ------------------------------------------------------------------ */
/* Contact messages                                                    */
/* ------------------------------------------------------------------ */

export async function createContactMessage(input: {
  name: string;
  email: string;
  topic: string;
  message: string;
}): Promise<void> {
  const sb = db();
  if (sb) {
    const { error } = await sb.from("contact_messages").insert(input);
    if (error) throw dbError(error);
    return;
  }
  mockStore.messages.unshift({
    ...input,
    id: `msg-${randomUUID().slice(0, 8)}`,
    status: "open",
    createdAt: new Date().toISOString(),
  });
}

/* ------------------------------------------------------------------ */
/* Admin                                                               */
/* ------------------------------------------------------------------ */

/** All recruiter accounts with their job counts, newest first. */
export async function listRecruiters(): Promise<RecruiterSummary[]> {
  const sb = db();
  if (sb) {
    const { data, error } = await sb
      .from("recruiters")
      .select(`${RECRUITER_PUBLIC_COLUMNS}, jobs(count)`)
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error) throw dbError(error);
    return (
      data as (Omit<RecruiterRow, "password_hash"> & { jobs: { count: number }[] })[]
    ).map((row) => ({
      ...toPublicRecruiter(row),
      jobCount: row.jobs?.[0]?.count ?? 0,
    }));
  }
  return mockStore.recruiters.map((r) => ({
    ...publicRecruiter(r),
    jobCount: mockStore.jobs.filter((j) => j.recruiterId === r.id).length,
  }));
}

export async function listContactMessages(): Promise<ContactMessage[]> {
  const sb = db();
  if (sb) {
    const { data, error } = await sb
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5000)
      .returns<MessageRow[]>();
    if (error) throw dbError(error);
    return data.map(toMessage);
  }
  return [...mockStore.messages];
}

export async function adminUpdateRecruiter(
  id: string,
  patch: { status?: AccountStatus; role?: UserRole }
): Promise<Recruiter | null> {
  const sb = db();
  if (sb) {
    if (!isUuid(id)) return null;
    const { data, error } = await sb
      .from("recruiters")
      .update(patch)
      .eq("id", id)
      .select(RECRUITER_PUBLIC_COLUMNS)
      .maybeSingle<Omit<RecruiterRow, "password_hash">>();
    if (error) throw dbError(error);
    return data ? toPublicRecruiter(data) : null;
  }
  const r = mockRecruiter(id);
  if (!r) return null;
  Object.assign(r, patch);
  return publicRecruiter(r);
}

/** Deletes any job (admin moderation). */
export async function adminDeleteJob(id: string): Promise<boolean> {
  const sb = db();
  if (sb) {
    if (!isUuid(id)) return false;
    const { data, error } = await sb.from("jobs").delete().eq("id", id).select("id");
    if (error) throw dbError(error);
    return data.length === 1;
  }
  const idx = mockStore.jobs.findIndex((j) => j.id === id);
  if (idx === -1) return false;
  mockStore.jobs.splice(idx, 1);
  return true;
}

/** Deletes a recruiter account and (via cascade) all their jobs. Never deletes admins. */
export async function adminDeleteRecruiter(id: string): Promise<boolean> {
  const sb = db();
  if (sb) {
    if (!isUuid(id)) return false;
    const { data, error } = await sb
      .from("recruiters")
      .delete()
      .eq("id", id)
      .eq("role", "recruiter")
      .select("id");
    if (error) throw dbError(error);
    return data.length === 1;
  }
  const idx = mockStore.recruiters.findIndex((r) => r.id === id && r.role === "recruiter");
  if (idx === -1) return false;
  mockStore.recruiters.splice(idx, 1);
  mockStore.jobs = mockStore.jobs.filter((j) => j.recruiterId !== id);
  return true;
}

export async function adminUpdateMessage(
  id: string,
  status: ContactMessage["status"]
): Promise<boolean> {
  const sb = db();
  if (sb) {
    if (!isUuid(id)) return false;
    const { data, error } = await sb
      .from("contact_messages")
      .update({ status })
      .eq("id", id)
      .select("id");
    if (error) throw dbError(error);
    return data.length === 1;
  }
  const m = mockStore.messages.find((x) => x.id === id);
  if (!m) return false;
  m.status = status;
  return true;
}

export async function adminDeleteMessage(id: string): Promise<boolean> {
  const sb = db();
  if (sb) {
    if (!isUuid(id)) return false;
    const { data, error } = await sb
      .from("contact_messages")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) throw dbError(error);
    return data.length === 1;
  }
  const idx = mockStore.messages.findIndex((x) => x.id === id);
  if (idx === -1) return false;
  mockStore.messages.splice(idx, 1);
  return true;
}
