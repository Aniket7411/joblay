import { z } from "zod";
import { fail, ok, serverError, validationFailed } from "@/lib/api";
import { getSessionRecruiterId } from "@/lib/auth/session";
import {
  getNicheTags,
  getSubRoles,
  industries,
  jobProfiles,
  locations,
} from "@/lib/data/filterHierarchy";
import { createJob, findRecruiterById, listJobs } from "@/lib/repository";
import { isOwnAttachmentUrl } from "@/lib/supabase";
import { jobPostSchema } from "@/lib/validations";

const querySchema = z.object({
  mine: z.string().optional(),
  location: z.string().max(100).optional(),
  jobProfile: z.string().max(100).optional(),
  industry: z.string().max(100).optional(),
  subRole: z.string().max(100).optional(),
  tags: z.string().max(1000).optional(),
  search: z.string().max(200).optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse(Object.fromEntries(searchParams));
    if (!parsed.success) return fail("Invalid query parameters", 400);

    const { mine, tags, ...filters } = parsed.data;

    let recruiterId: string | undefined;
    if (mine) {
      recruiterId = (await getSessionRecruiterId()) ?? undefined;
      if (!recruiterId) return fail("Not signed in", 401);
    }

    const jobs = await listJobs({
      ...filters,
      recruiterId,
      tags: tags ? tags.split(",").filter(Boolean) : undefined,
    });
    return ok("Jobs fetched", jobs);
  } catch (err) {
    return serverError(err, "jobs:GET");
  }
}

export async function POST(request: Request) {
  try {
    const recruiterId = await getSessionRecruiterId();
    if (!recruiterId || !(await findRecruiterById(recruiterId))) {
      return fail("Please sign in to post a job", 401);
    }

    const parsed = jobPostSchema.safeParse(await request.json());
    if (!parsed.success) return validationFailed(parsed.error);
    const data = parsed.data;

    // Keep posted values inside the known filter hierarchy so they stay
    // discoverable through the candidate filters.
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

    const job = await createJob({
      recruiterId,
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
    });

    return ok("Job posted successfully", job, { status: 201 });
  } catch (err) {
    return serverError(err, "jobs:POST");
  }
}
