import { fail, ok, serverError } from "@/lib/api";
import { getSessionRecruiterId } from "@/lib/auth/session";
import {
  ALLOWED_UPLOAD_TYPES,
  isSupabaseConfigured,
  MAX_UPLOAD_BYTES,
  uploadAttachment,
} from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const recruiterId = await getSessionRecruiterId();
    if (!recruiterId) return fail("Please sign in", 401);

    if (!isSupabaseConfigured()) {
      return fail("File uploads are not enabled", 503);
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return fail("No file provided", 400);
    if (!ALLOWED_UPLOAD_TYPES[file.type]) {
      return fail("Only PDF or Word documents are allowed", 400);
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return fail("File must be 5 MB or smaller", 400);
    }

    const url = await uploadAttachment(recruiterId, file);
    return ok("File uploaded", { url }, { status: 201 });
  } catch (err) {
    return serverError(err, "uploads:POST");
  }
}
