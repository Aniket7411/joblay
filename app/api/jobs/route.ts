import { NextResponse } from "next/server";
import { fail, ok, serverError } from "@/lib/api";
import { getCurrentRecruiter } from "@/lib/auth/current";
import { parseJobBody } from "@/lib/jobInput";
import { parseJobQuery } from "@/lib/jobQuery";
import { createJob, searchJobs } from "@/lib/repository";

/**
 * Public job search. Every filter is optional; multi-value filters are
 * comma-separated. See README → API for the full parameter list.
 *
 *   GET /api/jobs?q=react&location=Pune,Mumbai&workMode=Remote&experience=2&salary=6&page=1
 */
export async function GET(request: Request) {
  try {
    const query = parseJobQuery(new URL(request.url).searchParams);
    const result = await searchJobs(query);
    return ok("Jobs fetched", result, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" },
    });
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
