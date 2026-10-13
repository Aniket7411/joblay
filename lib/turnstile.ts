/**
 * Cloudflare Turnstile (free bot protection) — server-side check.
 *
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY  shown in the browser widget
 * TURNSTILE_SECRET_KEY            used here
 *
 * When TURNSTILE_SECRET_KEY isn't set, verification is skipped.
 */

export function isTurnstileEnabled(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
}

export async function verifyTurnstile(token: unknown, request: Request): Promise<boolean> {
  if (!isTurnstileEnabled()) return true;
  if (typeof token !== "string" || !token || token.length > 2048) return false;

  const body = new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY!, response: token });
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0].trim();
  if (ip) body.set("remoteip", ip);

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    if (!data.success) console.warn("[turnstile] rejected", data["error-codes"]);
    return Boolean(data.success);
  } catch (err) {
    // Fail closed: if Cloudflare can't be reached, don't let bots through.
    console.error("[turnstile] verify failed", err);
    return false;
  }
}

export const TURNSTILE_FAILED = "Please complete the security check and try again.";
