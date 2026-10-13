import { z } from "zod";
import { fail, ok, serverError, validationFailed } from "@/lib/api";
import { getCurrentAdmin } from "@/lib/auth/current";
import { adminDeleteMessage, adminUpdateMessage } from "@/lib/repository";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({ status: z.enum(["open", "resolved"]) });

export async function PATCH(request: Request, { params }: Params) {
  try {
    if (!(await getCurrentAdmin())) return fail("Admins only", 403);
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) return validationFailed(parsed.error);

    const { id } = await params;
    if (!(await adminUpdateMessage(id, parsed.data.status))) {
      return fail("Message not found", 404);
    }
    return ok("Message updated");
  } catch (err) {
    return serverError(err, "admin/messages:PATCH");
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    if (!(await getCurrentAdmin())) return fail("Admins only", 403);
    const { id } = await params;
    if (!(await adminDeleteMessage(id))) return fail("Message not found", 404);
    return ok("Message deleted");
  } catch (err) {
    return serverError(err, "admin/messages:DELETE");
  }
}
