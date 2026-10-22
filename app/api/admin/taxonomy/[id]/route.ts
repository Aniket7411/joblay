import { fail, ok, serverError } from "@/lib/api";
import { getCurrentAdmin } from "@/lib/auth/current";
import { deleteTaxonomyEntry } from "@/lib/repository";

type Params = { params: Promise<{ id: string }> };

/**
 * Removes an admin-added industry, role or skill, plus anything added under
 * it. Built-in ones can't be removed. Jobs already using it keep the value.
 */
export async function DELETE(_request: Request, { params }: Params) {
  try {
    if (!(await getCurrentAdmin())) return fail("Admins only", 403);
    const { id } = await params;
    const removed = await deleteTaxonomyEntry(id);
    if (!removed.length) return fail("Category not found", 404);
    return ok("Category removed", { removed });
  } catch (err) {
    return serverError(err, "admin/taxonomy:DELETE");
  }
}
