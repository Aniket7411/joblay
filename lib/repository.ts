import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { mockStore } from "@/lib/data/mockStore";
import { hashToken } from "@/lib/auth/password";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type {
  AccountStatus,
  ContactMessage,
  JobPosting,
  Recruiter,
  RecruiterSummary,
  UserRole,
} from "@/types";

/**
 * Single data-access layer. Uses Supabase Postgres when SUPABASE_URL and
 * SUPABASE_SECRET_KEY are set, otherwise an in-memory store (local dev only —
 * production requires Supabase). Schema: supabase/schema.sql
 */

export class DatabaseUnavailableError extends Error {
  constructor() {
    super("Database is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY.");
  }
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

export interface JobQuery {
  recruiterId?: string;
  location?: string;
  jobProfile?: string;
  industry?: string;
  subRole?: string;
  tags?: string[];
  search?: string;
  /** Include jobs from suspended employers (admin views). */
  includeSuspended?: boolean;
}

export type JobInput = Omit<JobPosting, "id" | "createdAt" | "updatedAt" | "recruiterId">;
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
  "id, recruiter_id, title, company, location, job_profile, industry, sub_role, tags, description, criteria, contact_name, contact_email, contact_phone, attachment_url, created_at, updated_at";

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
    if (error) throw error;
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
    if (error) throw error;
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
    if (error) throw error;
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
    if (error) throw error;
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
    if (error) throw error;
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

export async function listJobs(q: JobQuery = {}): Promise<JobPosting[]> {
  const sb = db();
  if (sb) {
    // Inner-join the owner so jobs from suspended employers can be hidden.
    let query = sb
      .from("jobs")
      .select(`${JOB_COLUMNS}, recruiters!inner(status)`)
      .order("created_at", { ascending: false })
      .limit(1000);

    if (!q.includeSuspended) query = query.eq("recruiters.status", "active");
    if (q.recruiterId) {
      if (!isUuid(q.recruiterId)) return [];
      query = query.eq("recruiter_id", q.recruiterId);
    }
    if (q.location) query = query.eq("location", q.location);
    if (q.jobProfile) query = query.eq("job_profile", q.jobProfile);
    if (q.industry) query = query.eq("industry", q.industry);
    if (q.subRole) query = query.eq("sub_role", q.subRole);
    if (q.tags?.length) query = query.overlaps("tags", q.tags);
    if (q.search) {
      // Strip characters that have meaning in PostgREST filter syntax.
      const term = q.search.replace(/[,()*%\\:"]/g, " ").trim();
      if (term) {
        query = query.or(
          ["title", "company", "location", "industry", "sub_role", "description"]
            .map((col) => `${col}.ilike.*${term}*`)
            .join(",")
        );
      }
    }

    const { data, error } = await query.returns<JobRow[]>();
    if (error) throw error;
    return data.map(toJob);
  }

  let results = [...mockStore.jobs].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
  if (!q.includeSuspended) {
    results = results.filter((j) => mockRecruiter(j.recruiterId)?.status !== "suspended");
  }
  if (q.recruiterId)
    results = results.filter((j) => j.recruiterId === q.recruiterId);
  if (q.location) results = results.filter((j) => j.location === q.location);
  if (q.jobProfile)
    results = results.filter((j) => j.jobProfile === q.jobProfile);
  if (q.industry) results = results.filter((j) => j.industry === q.industry);
  if (q.subRole) results = results.filter((j) => j.subRole === q.subRole);
  if (q.tags?.length) {
    const tags = q.tags;
    results = results.filter((j) => tags.some((t) => j.tags.includes(t)));
  }
  if (q.search) {
    const s = q.search.toLowerCase();
    results = results.filter((j) =>
      [j.title, j.company, j.location, j.industry, j.subRole, j.description, ...j.tags]
        .join(" ")
        .toLowerCase()
        .includes(s)
    );
  }
  return results;
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
    if (error) throw error;
    return data ? toJob(data) : null;
  }
  return mockStore.jobs.find((j) => j.id === id) ?? null;
}

export async function createJob(input: NewJob): Promise<JobPosting> {
  const sb = db();
  if (sb) {
    const { data, error } = await sb
      .from("jobs")
      .insert({ ...jobToRow(input), recruiter_id: input.recruiterId })
      .select(JOB_COLUMNS)
      .single<JobRow>();
    if (error) throw error;
    return toJob(data);
  }
  const now = new Date().toISOString();
  const job: JobPosting = {
    ...input,
    id: `job-${randomUUID().slice(0, 8)}`,
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
    if (error) throw error;
    return data ? toJob(data) : null;
  }
  const job = mockStore.jobs.find(
    (j) => j.id === id && (!ownerId || j.recruiterId === ownerId)
  );
  if (!job) return null;
  Object.assign(job, input, { updatedAt: new Date().toISOString() });
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
    if (error) throw error;
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
    if (error) throw error;
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
    if (error) throw error;
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
    if (error) throw error;
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
    if (error) throw error;
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
    if (error) throw error;
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
    if (error) throw error;
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
    if (error) throw error;
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
    if (error) throw error;
    return data.length === 1;
  }
  const idx = mockStore.messages.findIndex((x) => x.id === id);
  if (idx === -1) return false;
  mockStore.messages.splice(idx, 1);
  return true;
}
