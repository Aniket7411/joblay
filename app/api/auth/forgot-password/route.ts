import { fail, ok, serverError, validationFailed } from "@/lib/api";
import { TURNSTILE_FAILED, verifyTurnstile } from "@/lib/turnstile";
import { issuePasswordReset } from "@/lib/auth/reset";
import { findRecruiterByEmail } from "@/lib/repository";
import { forgotPasswordSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!(await verifyTurnstile(body?.turnstileToken, request))) {
      return fail(TURNSTILE_FAILED, 400);
    }
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) return validationFailed(parsed.error);

    const recruiter = await findRecruiterByEmail(parsed.data.email);
    if (recruiter?.role === "admin") {
      // Admin passwords are reset with scripts/create-admin.mjs, never by
      // email — admin addresses may not be mailboxes we control.
      console.warn(`[auth/forgot-password] reset requested for admin ${recruiter.email} — ignored`);
    } else if (recruiter && recruiter.status === "active") {
      try {
        await issuePasswordReset(recruiter, new URL(request.url).origin);
      } catch (err) {
        console.error("[auth/forgot-password] email failed", err);
      }
    }

    // Same response either way so accounts can't be enumerated.
    return ok("If an account exists, a reset link has been sent.");
  } catch (err) {
    return serverError(err, "auth/forgot-password");
  }
}
