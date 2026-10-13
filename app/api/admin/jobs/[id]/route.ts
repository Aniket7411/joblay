import { fail, ok, serverError } from "@/lib/api";
import { getCurrentAdmin } from "@/lib/auth/current";
import { notifyJobChanged } from "@/lib/indexing";
import { adminDeleteJob } from "@/lib/repository";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return fail("Admins only", 403);

    const { id } = await params;
    if (!(await adminDeleteJob(id))) return fail("Job not found", 404);
    notifyJobChanged(id, true);

    console.info(`[admin] ${admin.email} deleted job ${id}`);
    return ok("Job deleted");
  } catch (err) {
    return serverError(err, "admin/jobs:DELETE");
  }
}
