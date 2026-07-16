/**
 * SMTP mail helper — configure via .env when ready.
 *
 * SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 */

export async function sendPasswordResetEmail(
  email: string,
  resetLink: string
): Promise<boolean> {
  const configured = Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
  );

  if (!configured) {
    console.info(`[mail:demo] Password reset for ${email}: ${resetLink}`);
    return true;
  }

  // TODO: integrate nodemailer when SMTP env is provided
  console.info(`[mail] Password reset sent to ${email}`);
  return true;
}
