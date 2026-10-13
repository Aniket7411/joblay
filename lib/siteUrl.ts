/**
 * The site's public base URL (no trailing slash), from the first of:
 *   NEXT_PUBLIC_APP_URL                 set it to your custom domain
 *   VERCEL_PROJECT_PRODUCTION_URL       provided by Vercel automatically
 *   http://localhost:3000               local development
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;
  return "http://localhost:3000";
}

/** True when the URL is reachable from the internet (not localhost). */
export function isPublicSiteUrl(url = siteUrl()): boolean {
  return !/\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(url);
}
