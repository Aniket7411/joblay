import nodemailer, { type Transporter } from "nodemailer";

/**
 * SMTP mail (Gmail by default).
 *
 * SMTP_HOST=smtp.gmail.com  SMTP_PORT=465
 * SMTP_USER=you@gmail.com   SMTP_PASS=<16-char Google App Password>
 * SMTP_FROM="Joblay <you@gmail.com>"
 *
 * When SMTP is not configured, emails are logged to the server console.
 */

export function isMailConfigured(): boolean {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 465);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        // Google shows App Passwords with spaces; SMTP needs them without.
        pass: process.env.SMTP_PASS?.replace(/\s+/g, ""),
      },
    });
  }
  return transporter;
}

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
    /\/$/,
    ""
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layout(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f6f6f6;font-family:Arial,Helvetica,sans-serif;color:#111">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:12px;padding:32px">
<tr><td>
<div style="font-size:20px;font-weight:700;margin-bottom:24px">Joblay</div>
<h1 style="font-size:18px;margin:0 0 16px">${title}</h1>
${body}
<p style="font-size:12px;color:#888;margin-top:32px">You received this email because of activity on your Joblay recruiter account.</p>
</td></tr></table></td></tr></table></body></html>`;
}

async function send(
  to: string,
  subject: string,
  html: string,
  text: string,
  replyTo?: string
) {
  if (!isMailConfigured()) {
    console.info(`[mail:demo] To: ${to} | ${subject}\n${text}`);
    return;
  }
  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    replyTo,
    subject,
    html,
    text,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  resetLink: string
): Promise<void> {
  const html = layout(
    "Reset your password",
    `<p style="font-size:14px;line-height:1.6">We received a request to reset your Joblay password. This link expires in 1 hour.</p>
<p style="margin:24px 0"><a href="${escapeHtml(resetLink)}" style="background:#f97316;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;font-size:14px">Reset password</a></p>
<p style="font-size:12px;color:#666;word-break:break-all">Or paste this link into your browser:<br>${escapeHtml(resetLink)}</p>
<p style="font-size:12px;color:#666">If you didn't request this, you can ignore this email.</p>`
  );
  await send(
    email,
    "Reset your Joblay password",
    html,
    `Reset your Joblay password (expires in 1 hour): ${resetLink}`
  );
}

export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<void> {
  const dashboard = `${appUrl()}/dashboard`;
  const html = layout(
    `Welcome, ${escapeHtml(name)}`,
    `<p style="font-size:14px;line-height:1.6">Your recruiter account is ready. Post a job and candidates will reach out to you directly by phone or email.</p>
<p style="margin:24px 0"><a href="${dashboard}" style="background:#f97316;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;font-size:14px">Go to dashboard</a></p>`
  );
  await send(
    email,
    "Welcome to Joblay",
    html,
    `Welcome to Joblay, ${name}. Your dashboard: ${dashboard}`
  );
}

/** Forwards a contact-form message to the site inbox; replies go to the sender. */
export async function sendContactEmail(input: {
  name: string;
  email: string;
  topicLabel: string;
  message: string;
}): Promise<void> {
  const to = process.env.CONTACT_TO_EMAIL || process.env.SMTP_USER || "";
  const subject = `[Joblay] ${input.topicLabel} — ${input.name}`;
  const html = layout(
    escapeHtml(input.topicLabel),
    `<p style="font-size:14px;line-height:1.6"><strong>From:</strong> ${escapeHtml(input.name)} &lt;${escapeHtml(input.email)}&gt;</p>
<div style="font-size:14px;line-height:1.6;white-space:pre-wrap;border-left:3px solid #f97316;padding-left:12px;margin-top:16px">${escapeHtml(input.message)}</div>
<p style="font-size:12px;color:#666;margin-top:24px">Reply to this email to respond directly to the sender.</p>`
  );
  await send(
    to,
    subject,
    html,
    `From: ${input.name} <${input.email}>\nTopic: ${input.topicLabel}\n\n${input.message}`,
    input.email
  );
}
