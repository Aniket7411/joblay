import { fail, ok, serverError } from "@/lib/api";
import { getCurrentAdmin } from "@/lib/auth/current";
import { listContactMessages, listJobs, listRecruiters } from "@/lib/repository";
import type { AdminOverview } from "@/types";

export async function GET() {
  try {
    if (!(await getCurrentAdmin())) return fail("Admins only", 403);
    const [jobs, recruiters, messages] = await Promise.all([
      listJobs({ includeSuspended: true }),
      listRecruiters(),
      listContactMessages(),
    ]);
    return ok<AdminOverview>("Admin overview", { jobs, recruiters, messages });
  } catch (err) {
    return serverError(err, "admin/overview");
  }
}
