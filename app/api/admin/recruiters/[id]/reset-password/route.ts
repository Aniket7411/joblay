import { fail, ok, serverError } from "@/lib/api";
import { getCurrentAdmin } from "@/lib/auth/current";
import { issuePasswordReset } from "@/lib/auth/reset";
import { isMailConfigured } from "@/lib/mail";
import { findRecruiterById } from "@/lib/repository";

/** Emails a password reset link to an employer. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return fail("Admins only", 403);
    if (!isMailConfigured()) return fail("Email (SMTP) is not configured", 503);

    const { id } = await params;
    const recruiter = await findRecruiterById(id);
    if (!recruiter) return fail("Account not found", 404);
    if (recruiter.role === "admin") {
      return fail("Admin passwords are reset with the create-admin script", 400);
    }

    await issuePasswordReset(recruiter, new URL(request.url).origin);
    console.info(`[admin] ${admin.email} sent a password reset to ${recruiter.email}`);
    return ok(`Reset link sent to ${recruiter.email}`);
  } catch (err) {
    return serverError(err, "admin/reset-password");
  }
}
