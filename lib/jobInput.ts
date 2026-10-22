import { NextResponse } from "next/server";
import { fail, validationFailed } from "@/lib/api";
import {
  getNicheTags,
  getSubRoles,
  jobProfiles,
  locations,
  type Taxonomy,
} from "@/lib/data/filterHierarchy";
import type { JobInput } from "@/lib/repository";
import { normalizePhone } from "@/lib/phone";
import { isOwnAttachmentUrl } from "@/lib/supabase";
import { jobPostSchema, type JobPostFormData } from "@/lib/validations";

/**
 * Validates a job create/update request body. Returns the normalized input,
 * or a ready-to-send error response.
 */
const NUMERIC_FIELDS = ["experienceMin", "experienceMax", "salaryMin", "salaryMax", "openings"];

export function parseJobBody(body: unknown, taxonomy: Taxonomy): JobInput | NextResponse {
  // API clients may send numbers; the form sends strings. Normalize first.
  if (body && typeof body === "object") {
    body = { ...body };
    for (const key of NUMERIC_FIELDS) {
      const v = (body as Record<string, unknown>)[key];
      if (typeof v === "number") (body as Record<string, unknown>)[key] = String(v);
      if (v === null) (body as Record<string, unknown>)[key] = "";
    }
  }
  const parsed = jobPostSchema.safeParse(body);
  if (!parsed.success) return validationFailed(parsed.error);
  const data = parsed.data;

  // Keep values inside the known filter hierarchy so jobs stay discoverable
  // through the candidate filters.
  const allowedTags = getNicheTags(data.industry, data.subRole, taxonomy);
  if (
    !(locations as readonly string[]).includes(data.location) ||
    !(jobProfiles as readonly string[]).includes(data.jobProfile) ||
    !Object.hasOwn(taxonomy, data.industry) ||
    !getSubRoles(data.industry, taxonomy).includes(data.subRole) ||
    !data.tags.every((t) => allowedTags.includes(t))
  ) {
    return fail("Invalid location, profile, industry, sub-role or tags", 400);
  }

  if (data.attachmentUrl && !isOwnAttachmentUrl(data.attachmentUrl)) {
    return fail("Invalid attachment", 400);
  }

  let phone: string | undefined;
  if (data.contactPhone?.trim()) {
    phone = normalizePhone(data.contactPhone) ?? undefined;
    if (!phone) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: { contactPhone: ["Enter a valid mobile number, e.g. 98765 43210"] },
        },
        { status: 400 }
      );
    }
  }

  const salaryMin = data.salaryMin ? Number(data.salaryMin) : undefined;
  return {
    title: data.title.trim(),
    company: data.company.trim(),
    location: data.location,
    jobProfile: data.jobProfile,
    industry: data.industry,
    subRole: data.subRole,
    tags: data.tags,
    description: data.description.trim(),
    criteria: data.criteria
      .split("\n")
      .map((c) => c.trim())
      .filter(Boolean),
    contact: {
      name: data.contactName?.trim() || undefined,
      email: data.contactEmail?.trim() || undefined,
      phone,
    },
    attachmentUrl: data.attachmentUrl || undefined,
    workMode: data.workMode,
    jobType: data.jobType,
    education: data.education,
    experienceMin: Number(data.experienceMin),
    experienceMax: Number(data.experienceMax),
    // Only a minimum given → treat as a fixed figure (max = min).
    salaryMin,
    salaryMax: salaryMin === undefined ? undefined : Number(data.salaryMax || data.salaryMin),
    openings: Number(data.openings),
    urgent: data.urgent ?? false,
  };
}

/** Converts a stored job back into form values (for the edit form). */
export function jobToFormValues(job: {
  title: string;
  company: string;
  location: string;
  jobProfile: string;
  industry: string;
  subRole: string;
  tags: string[];
  description: string;
  criteria: string[];
  contact: { name?: string; email?: string; phone?: string };
  attachmentUrl?: string;
  workMode: string;
  jobType: string;
  education: string;
  experienceMin: number;
  experienceMax: number;
  salaryMin?: number;
  salaryMax?: number;
  openings: number;
  urgent?: boolean;
}): JobPostFormData {
  return {
    title: job.title,
    company: job.company,
    location: job.location,
    jobProfile: job.jobProfile,
    industry: job.industry,
    subRole: job.subRole,
    tags: job.tags,
    description: job.description,
    criteria: job.criteria.join("\n"),
    contactName: job.contact.name ?? "",
    contactEmail: job.contact.email ?? "",
    contactPhone: job.contact.phone ?? "",
    attachmentUrl: job.attachmentUrl ?? "",
    workMode: job.workMode as JobPostFormData["workMode"],
    jobType: job.jobType as JobPostFormData["jobType"],
    education: job.education as JobPostFormData["education"],
    experienceMin: String(job.experienceMin),
    experienceMax: String(job.experienceMax),
    salaryMin: job.salaryMin === undefined ? "" : String(job.salaryMin),
    salaryMax: job.salaryMax === undefined ? "" : String(job.salaryMax),
    openings: String(job.openings),
    urgent: job.urgent ?? false,
  };
}
