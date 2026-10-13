import { NextResponse } from "next/server";
import { z } from "zod";
import { fail, ok, serverError } from "@/lib/api";
import { getCurrentRecruiter } from "@/lib/auth/current";
import { parseJobBody } from "@/lib/jobInput";
import { createJob, listJobs } from "@/lib/repository";

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
      recruiterId = (await getCurrentRecruiter())?.id;
      if (!recruiterId) return fail("Not signed in", 401);
    }

    const jobs = await listJobs({
      ...filters,
      recruiterId,
      // Recruiters always see their own jobs.
      includeSuspended: Boolean(mine),
      tags: tags ? tags.split(",").filter(Boolean) : undefined,
    });
    return ok("Jobs fetched", jobs);
  } catch (err) {
    return serverError(err, "jobs:GET");
  }
}

export async function POST(request: Request) {
  try {
    const recruiter = await getCurrentRecruiter();
    if (!recruiter) return fail("Please sign in to post a job", 401);

    const input = parseJobBody(await request.json());
    if (input instanceof NextResponse) return input;

    const job = await createJob({ ...input, recruiterId: recruiter.id });
    return ok("Job posted successfully", job, { status: 201 });
  } catch (err) {
    return serverError(err, "jobs:POST");
  }
}
