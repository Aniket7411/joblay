import { createResetToken } from "@/lib/auth/password";
import { sendPasswordResetEmail } from "@/lib/mail";
import { setResetToken } from "@/lib/repository";

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Issues a single-use reset token for the recruiter and emails the link.
 * `origin` is used when NEXT_PUBLIC_APP_URL isn't set.
 */
export async function issuePasswordReset(
  recruiter: { id: string; email: string },
  origin: string
): Promise<void> {
  const { token, tokenHash } = createResetToken();
  await setResetToken(recruiter.id, tokenHash, new Date(Date.now() + RESET_TTL_MS));

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || origin).replace(/\/$/, "");
  await sendPasswordResetEmail(
    recruiter.email,
    `${baseUrl}/reset-password?token=${token}`
  );
}
