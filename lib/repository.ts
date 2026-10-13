import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { mockStore } from "@/lib/data/mockStore";
import { hashToken } from "@/lib/auth/password";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { JobPosting, Recruiter, RecruiterSummary, UserRole } from "@/types";

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
}

type NewJob = Omit<JobPosting, "id" | "createdAt">;

/* ------------------------------------------------------------------ */
/* Row mapping (snake_case table columns ↔ app types)                  */
/* ------------------------------------------------------------------ */

interface RecruiterRow {
  id: string;
  name: string;
  email: string;
  company: string | null;
  role: UserRole;
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
}

const RECRUITER_COLUMNS = "id, name, email, company, role, password_hash, created_at";

function toRecruiter(row: RecruiterRow): RecruiterWithHash {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    company: row.company ?? undefined,
    role: row.role ?? "recruiter",
    createdAt: new Date(row.created_at).toISOString(),
    passwordHash: row.password_hash,
  };
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
  };
}

export function publicRecruiter(r: RecruiterWithHash): Recruiter {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    company: r.company,
    role: r.role,
    createdAt: r.createdAt,
  };
}

function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/** Postgres unique-violation, e.g. a concurrent registration. */
export function isDuplicateError(err: unknown): boolean {
  return (err as { code?: string })?.code === "23505";
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
  return mockStore.recruiters.find((r) => r.id === id) ?? null;
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
    createdAt: new Date().toISOString(),
    passwordHash: input.passwordHash,
  };
  mockStore.recruiters.push(recruiter);
  return recruiter;
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
  const r = mockStore.recruiters.find((x) => x.id === recruiterId);
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
    let query = sb
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

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

export async function createJob(input: NewJob): Promise<JobPosting> {
  const sb = db();
  if (sb) {
    const { data, error } = await sb
      .from("jobs")
      .insert({
        recruiter_id: input.recruiterId,
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
      })
      .select("*")
      .single<JobRow>();
    if (error) throw error;
    return toJob(data);
  }
  const job: JobPosting = {
    ...input,
    id: `job-${randomUUID().slice(0, 8)}`,
    createdAt: new Date().toISOString(),
  };
  mockStore.jobs.unshift(job);
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
/* Admin                                                               */
/* ------------------------------------------------------------------ */

/** All recruiter accounts with their job counts, newest first. */
export async function listRecruiters(): Promise<RecruiterSummary[]> {
  const sb = db();
  if (sb) {
    const { data, error } = await sb
      .from("recruiters")
      .select("id, name, email, company, role, created_at, jobs(count)")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw error;
    return (data as (Omit<RecruiterRow, "password_hash"> & { jobs: { count: number }[] })[]).map(
      (row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        company: row.company ?? undefined,
        role: row.role ?? "recruiter",
        createdAt: new Date(row.created_at).toISOString(),
        jobCount: row.jobs?.[0]?.count ?? 0,
      })
    );
  }
  return mockStore.recruiters.map((r) => ({
    ...publicRecruiter(r),
    jobCount: mockStore.jobs.filter((j) => j.recruiterId === r.id).length,
  }));
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
