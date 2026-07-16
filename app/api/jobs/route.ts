import { NextResponse } from "next/server";
import { z } from "zod";
import { mockStore } from "@/lib/data/mockStore";
import type { JobPosting } from "@/types";

const querySchema = z.object({
  recruiterId: z.string().optional(),
  location: z.string().optional(),
  jobProfile: z.string().optional(),
  industry: z.string().optional(),
  subRole: z.string().optional(),
  tags: z.string().optional(),
  search: z.string().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    recruiterId: searchParams.get("recruiterId") ?? undefined,
    location: searchParams.get("location") ?? undefined,
    jobProfile: searchParams.get("jobProfile") ?? undefined,
    industry: searchParams.get("industry") ?? undefined,
    subRole: searchParams.get("subRole") ?? undefined,
    tags: searchParams.get("tags") ?? undefined,
    search: searchParams.get("search") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Invalid query parameters" },
      { status: 400 }
    );
  }

  const { recruiterId, location, jobProfile, industry, subRole, tags, search } =
    parsed.data;

  let results: JobPosting[] = recruiterId
    ? mockStore.jobs.getByRecruiter(recruiterId)
    : mockStore.jobs.getAll();

  if (location) results = results.filter((j) => j.location === location);
  if (jobProfile) results = results.filter((j) => j.jobProfile === jobProfile);
  if (industry) results = results.filter((j) => j.industry === industry);
  if (subRole) results = results.filter((j) => j.subRole === subRole);
  if (tags) {
    const tagList = tags.split(",");
    results = results.filter((j) =>
      tagList.some((t) => j.tags.includes(t))
    );
  }
  if (search) {
    const q = search.toLowerCase();
    results = results.filter((j) =>
      [j.title, j.company, j.location, j.industry, ...j.tags]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }

  return NextResponse.json({
    success: true,
    message: "Jobs fetched",
    data: results,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { jobPostSchema } = await import("@/lib/validations");
    const parsed = jobPostSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { recruiterId } = body as { recruiterId?: string };
    if (!recruiterId) {
      return NextResponse.json(
        { success: false, message: "Recruiter authentication required" },
        { status: 401 }
      );
    }

    const data = parsed.data;
    const job: JobPosting = {
      id: `job-${crypto.randomUUID().slice(0, 8)}`,
      recruiterId,
      title: data.title,
      company: data.company,
      location: data.location,
      jobProfile: data.jobProfile,
      industry: data.industry,
      subRole: data.subRole,
      tags: data.tags,
      description: data.description,
      criteria: data.criteria
        .split("\n")
        .map((c) => c.trim())
        .filter(Boolean),
      contact: {
        name: data.contactName?.trim() || undefined,
        email: data.contactEmail?.trim() || undefined,
        phone: data.contactPhone?.trim() || undefined,
      },
      createdAt: new Date().toISOString(),
    };

    mockStore.jobs.create(job);

    return NextResponse.json({
      success: true,
      message: "Job posted successfully",
      data: job,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request body" },
      { status: 400 }
    );
  }
}
