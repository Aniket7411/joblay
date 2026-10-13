import { NextResponse } from "next/server";
import { fail, validationFailed } from "@/lib/api";
import {
  getNicheTags,
  getSubRoles,
  industries,
  jobProfiles,
  locations,
} from "@/lib/data/filterHierarchy";
import type { JobInput } from "@/lib/repository";
import { isOwnAttachmentUrl } from "@/lib/supabase";
import { jobPostSchema, type JobPostFormData } from "@/lib/validations";

/**
 * Validates a job create/update request body. Returns the normalized input,
 * or a ready-to-send error response.
 */
export function parseJobBody(body: unknown): JobInput | NextResponse {
  const parsed = jobPostSchema.safeParse(body);
  if (!parsed.success) return validationFailed(parsed.error);
  const data = parsed.data;

  // Keep values inside the known filter hierarchy so jobs stay discoverable
  // through the candidate filters.
  const allowedTags = getNicheTags(data.industry, data.subRole);
  if (
    !(locations as readonly string[]).includes(data.location) ||
    !(jobProfiles as readonly string[]).includes(data.jobProfile) ||
    !(industries as readonly string[]).includes(data.industry) ||
    !getSubRoles(data.industry).includes(data.subRole) ||
    !data.tags.every((t) => allowedTags.includes(t))
  ) {
    return fail("Invalid location, profile, industry, sub-role or tags", 400);
  }

  if (data.attachmentUrl && !isOwnAttachmentUrl(data.attachmentUrl)) {
    return fail("Invalid attachment", 400);
  }

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
      phone: data.contactPhone?.trim() || undefined,
    },
    attachmentUrl: data.attachmentUrl || undefined,
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
  };
}
