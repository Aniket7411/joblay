import { createResetToken } from "@/lib/auth/password";
import { sendPasswordResetEmail } from "@/lib/mail";
import { setResetToken } from "@/lib/repository";
import { isPublicSiteUrl, siteUrl } from "@/lib/siteUrl";

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Issues a single-use reset token for the recruiter and emails the link.
 * `origin` (the request's) is used when no public site URL is configured.
 */
export async function issuePasswordReset(
  recruiter: { id: string; email: string },
  origin: string
): Promise<void> {
  const { token, tokenHash } = createResetToken();
  await setResetToken(recruiter.id, tokenHash, new Date(Date.now() + RESET_TTL_MS));

  const baseUrl = isPublicSiteUrl() ? siteUrl() : origin.replace(/\/$/, "");
  await sendPasswordResetEmail(
    recruiter.email,
    `${baseUrl}/reset-password?token=${token}`
  );
}
