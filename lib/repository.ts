import { randomUUID } from "node:crypto";
import { connectDB, isDatabaseConfigured } from "@/lib/db";
import { mockStore } from "@/lib/data/mockStore";
import { JobPostingModel } from "@/lib/models/JobPosting";
import { RecruiterModel } from "@/lib/models/Recruiter";
import { hashToken } from "@/lib/auth/password";
import type { JobPosting, Recruiter } from "@/types";

/**
 * Single data-access layer. Uses MongoDB when MONGODB_URI is set, otherwise
 * an in-memory store (local dev only — production requires MongoDB).
 */

export class DatabaseUnavailableError extends Error {
  constructor() {
    super("Database is not configured. Set MONGODB_URI.");
  }
}

async function shouldUseMongo(): Promise<boolean> {
  if (isDatabaseConfigured()) {
    await connectDB();
    return true;
  }
  if (process.env.NODE_ENV === "production") {
    throw new DatabaseUnavailableError();
  }
  return false;
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
/* Mappers                                                             */
/* ------------------------------------------------------------------ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toRecruiter(doc: any): RecruiterWithHash {
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    company: doc.company || undefined,
    createdAt: new Date(doc.createdAt).toISOString(),
    passwordHash: doc.passwordHash,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toJob(doc: any): JobPosting {
  return {
    id: String(doc._id),
    recruiterId: String(doc.recruiterId),
    title: doc.title,
    company: doc.company,
    location: doc.location,
    jobProfile: doc.jobProfile,
    industry: doc.industry,
    subRole: doc.subRole,
    tags: doc.tags ?? [],
    description: doc.description,
    criteria: doc.criteria ?? [],
    contact: {
      name: doc.contact?.name || undefined,
      email: doc.contact?.email || undefined,
      phone: doc.contact?.phone || undefined,
    },
    attachmentUrl: doc.attachmentUrl || undefined,
    createdAt: new Date(doc.createdAt).toISOString(),
  };
}

export function publicRecruiter(r: RecruiterWithHash): Recruiter {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    company: r.company,
    createdAt: r.createdAt,
  };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isObjectId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id);
}

/* ------------------------------------------------------------------ */
/* Recruiters                                                          */
/* ------------------------------------------------------------------ */

export async function findRecruiterByEmail(
  email: string
): Promise<RecruiterWithHash | null> {
  const normalized = email.trim().toLowerCase();
  if (await shouldUseMongo()) {
    const doc = await RecruiterModel.findOne({ email: normalized }).lean();
    return doc ? toRecruiter(doc) : null;
  }
  return mockStore.recruiters.find((r) => r.email === normalized) ?? null;
}

export async function findRecruiterById(
  id: string
): Promise<RecruiterWithHash | null> {
  if (await shouldUseMongo()) {
    if (!isObjectId(id)) return null;
    const doc = await RecruiterModel.findById(id).lean();
    return doc ? toRecruiter(doc) : null;
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
  if (await shouldUseMongo()) {
    const doc = await RecruiterModel.create({ ...input, email });
    return toRecruiter(doc.toObject());
  }
  const recruiter = {
    id: `rec-${randomUUID().slice(0, 8)}`,
    name: input.name,
    email,
    company: input.company,
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
  if (await shouldUseMongo()) {
    await RecruiterModel.updateOne(
      { _id: recruiterId },
      { resetTokenHash: tokenHash, resetTokenExpires: expires }
    );
    return;
  }
  const r = mockStore.recruiters.find((x) => x.id === recruiterId);
  if (r) {
    r.resetTokenHash = tokenHash;
    r.resetTokenExpires = expires.getTime();
  }
}

/** Atomically consumes a valid reset token and sets the new password hash. */
export async function resetPasswordWithToken(
  token: string,
  passwordHash: string
): Promise<boolean> {
  const tokenHash = hashToken(token);
  if (await shouldUseMongo()) {
    const res = await RecruiterModel.updateOne(
      { resetTokenHash: tokenHash, resetTokenExpires: { $gt: new Date() } },
      {
        $set: { passwordHash },
        $unset: { resetTokenHash: 1, resetTokenExpires: 1 },
      }
    );
    return res.modifiedCount === 1;
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
  if (await shouldUseMongo()) {
    const filter: Record<string, unknown> = {};
    if (q.recruiterId) {
      if (!isObjectId(q.recruiterId)) return [];
      filter.recruiterId = q.recruiterId;
    }
    if (q.location) filter.location = q.location;
    if (q.jobProfile) filter.jobProfile = q.jobProfile;
    if (q.industry) filter.industry = q.industry;
    if (q.subRole) filter.subRole = q.subRole;
    if (q.tags?.length) filter.tags = { $in: q.tags };
    if (q.search) {
      const rx = new RegExp(escapeRegex(q.search), "i");
      filter.$or = [
        { title: rx },
        { company: rx },
        { location: rx },
        { industry: rx },
        { subRole: rx },
        { tags: rx },
      ];
    }
    const docs = await JobPostingModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();
    return docs.map(toJob);
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
      [j.title, j.company, j.location, j.industry, j.subRole, ...j.tags]
        .join(" ")
        .toLowerCase()
        .includes(s)
    );
  }
  return results;
}

export async function createJob(input: NewJob): Promise<JobPosting> {
  if (await shouldUseMongo()) {
    const doc = await JobPostingModel.create(input);
    return toJob(doc.toObject());
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
  if (await shouldUseMongo()) {
    if (!isObjectId(id)) return false;
    const res = await JobPostingModel.deleteOne({ _id: id, recruiterId });
    return res.deletedCount === 1;
  }
  const idx = mockStore.jobs.findIndex(
    (j) => j.id === id && j.recruiterId === recruiterId
  );
  if (idx === -1) return false;
  mockStore.jobs.splice(idx, 1);
  return true;
}
