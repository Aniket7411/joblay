import { z } from "zod";
import { fail, ok, serverError, validationFailed } from "@/lib/api";
import { getCurrentAdmin } from "@/lib/auth/current";
import { adminDeleteRecruiter, adminUpdateRecruiter } from "@/lib/repository";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z
  .object({
    status: z.enum(["active", "suspended"]).optional(),
    role: z.enum(["recruiter", "admin"]).optional(),
  })
  .refine((p) => p.status || p.role, { message: "Nothing to update" });

/** Suspend / reactivate an employer, or change their role. */
export async function PATCH(request: Request, { params }: Params) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return fail("Admins only", 403);

    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) return validationFailed(parsed.error);

    const { id } = await params;
    if (id === admin.id) {
      return fail("You can't change your own account here", 400);
    }

    const updated = await adminUpdateRecruiter(id, parsed.data);
    if (!updated) return fail("Account not found", 404);

    console.info(`[admin] ${admin.email} updated ${updated.email}: ${JSON.stringify(parsed.data)}`);
    return ok("Account updated", updated);
  } catch (err) {
    return serverError(err, "admin/recruiters:PATCH");
  }
}

export async function DELETE(_request: Request, { params }: Params) {
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
