import { fail, ok, serverError, validationFailed } from "@/lib/api";
import { getCurrentAdmin } from "@/lib/auth/current";
import { bulkHiringPopupSchema, saveBulkHiringPopup } from "@/lib/bulkHiring";

/** Turns the bulk hiring popup on/off and edits its text. */
export async function PUT(request: Request) {
  try {
    if (!(await getCurrentAdmin())) return fail("Admins only", 403);
    const parsed = bulkHiringPopupSchema.safeParse(await request.json());
    if (!parsed.success) return validationFailed(parsed.error);
    const saved = await saveBulkHiringPopup(parsed.data);
    return ok(saved.enabled ? "Popup is live for visitors" : "Popup switched off", saved);
  } catch (err) {
    return serverError(err, "admin/popup:PUT");
  }
}
