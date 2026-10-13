import { fail, ok, serverError } from "@/lib/api";
import { getCurrentAdmin } from "@/lib/auth/current";
import { listJobs, listRecruiters } from "@/lib/repository";

export async function GET() {
  try {
    if (!(await getCurrentAdmin())) return fail("Admins only", 403);
    const [jobs, recruiters] = await Promise.all([listJobs(), listRecruiters()]);
    return ok("Admin overview", { jobs, recruiters });
  } catch (err) {
    return serverError(err, "admin/overview");
  }
}
