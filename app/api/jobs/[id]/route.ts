import { NextResponse } from "next/server";
import { fail, ok, serverError } from "@/lib/api";
import { getCurrentRecruiter } from "@/lib/auth/current";
import { notifyJobChanged } from "@/lib/indexing";
import { parseJobBody } from "@/lib/jobInput";
import { getTaxonomy } from "@/lib/taxonomy";
import { deleteJob, updateJob } from "@/lib/repository";

type Params = { params: Promise<{ id: string }> };

/** Edit a job: owners can edit their own jobs, admins can edit any job. */
export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await getCurrentRecruiter();
    if (!user) return fail("Please sign in", 401);

    const input = parseJobBody(await request.json(), await getTaxonomy());
    if (input instanceof NextResponse) return input;

    const { id } = await params;
    const job = await updateJob(id, input, user.role === "admin" ? null : user.id);
    if (!job) return fail("Job not found", 404);
    notifyJobChanged(job.id);

    if (user.role === "admin" && job.recruiterId !== user.id) {
      console.info(`[admin] ${user.email} edited job ${id}`);
    }
    return ok("Job updated", job);
  } catch (err) {
    return serverError(err, "jobs:PATCH");
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await getCurrentRecruiter();
    if (!user) return fail("Please sign in", 401);

    const { id } = await params;
    const deleted = await deleteJob(id, user.id);
    if (!deleted) return fail("Job not found", 404);
    notifyJobChanged(id, true);

    return ok("Job deleted");
  } catch (err) {
    return serverError(err, "jobs:DELETE");
  }
}
