import { fail, ok, serverError } from "@/lib/api";
import { getCurrentAdmin } from "@/lib/auth/current";
import { adminDeleteRecruiter } from "@/lib/repository";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return fail("Admins only", 403);

    const { id } = await params;
    if (!(await adminDeleteRecruiter(id))) {
      return fail("Recruiter not found (admin accounts can't be deleted here)", 404);
    }

    console.info(`[admin] ${admin.email} deleted recruiter ${id}`);
    return ok("Recruiter and their jobs deleted");
  } catch (err) {
    return serverError(err, "admin/recruiters:DELETE");
  }
}
