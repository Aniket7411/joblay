import { fail, ok, serverError } from "@/lib/api";
import { getCurrentRecruiter } from "@/lib/auth/current";

export async function GET() {
  try {
    const recruiter = await getCurrentRecruiter();
    if (!recruiter) return fail("Not signed in", 401);
    return ok("Signed in", recruiter);
  } catch (err) {
    return serverError(err, "auth/me");
  }
}
