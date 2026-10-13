import { ok, serverError, validationFailed } from "@/lib/api";
import { createResetToken } from "@/lib/auth/password";
import { sendPasswordResetEmail } from "@/lib/mail";
import { findRecruiterByEmail, setResetToken } from "@/lib/repository";
import { forgotPasswordSchema } from "@/lib/validations";

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function POST(request: Request) {
  try {
    const parsed = forgotPasswordSchema.safeParse(await request.json());
    if (!parsed.success) return validationFailed(parsed.error);

    const recruiter = await findRecruiterByEmail(parsed.data.email);
    if (recruiter?.role === "admin") {
      // Admin passwords are reset with scripts/create-admin.mjs, never by
      // email — admin addresses may not be mailboxes we control.
      console.warn(`[auth/forgot-password] reset requested for admin ${recruiter.email} — ignored`);
    } else if (recruiter) {
      const { token, tokenHash } = createResetToken();
      await setResetToken(
        recruiter.id,
        tokenHash,
        new Date(Date.now() + RESET_TTL_MS)
      );

      const baseUrl = (
        process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
      ).replace(/\/$/, "");
      const resetLink = `${baseUrl}/reset-password?token=${token}`;

      try {
        await sendPasswordResetEmail(recruiter.email, resetLink);
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
