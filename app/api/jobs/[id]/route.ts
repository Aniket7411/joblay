import { fail, ok, serverError } from "@/lib/api";
import { getSessionRecruiterId } from "@/lib/auth/session";
import { deleteJob } from "@/lib/repository";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const recruiterId = await getSessionRecruiterId();
    if (!recruiterId) return fail("Please sign in", 401);

    const { id } = await params;
    const deleted = await deleteJob(id, recruiterId);
    if (!deleted) return fail("Job not found", 404);

    return ok("Job deleted");
  } catch (err) {
    return serverError(err, "jobs:DELETE");
  }
}
