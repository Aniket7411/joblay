import { createSign } from "node:crypto";
import { after } from "next/server";
import { isPublicSiteUrl, siteUrl } from "@/lib/siteUrl";

/**
 * Tells search engines a job page changed so it's (re)crawled within hours.
 * Free; each service is skipped unless configured. Runs after the response.
 *
 * IndexNow (Bing, Yandex, Seznam, Naver…):  INDEXNOW_KEY
 *   any 8–128 char [a-zA-Z0-9-] string; served at /indexnow-key.txt
 * Google Indexing API (JobPosting pages):  GOOGLE_INDEXING_CLIENT_EMAIL,
 *   GOOGLE_INDEXING_PRIVATE_KEY — a service account added as an Owner of
 *   the site in Google Search Console.
 */

/** Public site URL, or null on localhost (search engines can't crawl it). */
function publicUrl(): string | null {
  const url = siteUrl();
  return isPublicSiteUrl(url) ? url : null;
}

export function indexingStatus() {
  return {
    indexNow: Boolean(process.env.INDEXNOW_KEY),
    google: Boolean(process.env.GOOGLE_INDEXING_CLIENT_EMAIL && process.env.GOOGLE_INDEXING_PRIVATE_KEY),
    siteUrl: publicUrl(),
  };
}

/** Schedule a ping for /jobs/{id}. `removed` = the page now 404s. */
export function notifyJobChanged(jobId: string, removed = false) {
  const base = publicUrl();
  if (!base) return;
  const url = `${base}/jobs/${jobId}`;
  after(async () => {
    await Promise.allSettled([pingIndexNow(base, url), pingGoogle(url, removed)]);
  });
}

async function pingIndexNow(base: string, url: string) {
  const key = process.env.INDEXNOW_KEY;
  if (!key) return;
  try {
    const res = await fetch("https://www.bing.com/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: new URL(base).host,
        key,
        keyLocation: `${base}/indexnow-key.txt`,
        urlList: [url],
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (res.status >= 400) console.warn(`[indexnow] ${res.status} for ${url}`);
  } catch (err) {
    console.warn("[indexnow] failed", err);
  }
}

let googleToken: { value: string; expires: number } | null = null;

async function googleAccessToken(): Promise<string | null> {
  const email = process.env.GOOGLE_INDEXING_CLIENT_EMAIL;
  const rawKey = process.env.GOOGLE_INDEXING_PRIVATE_KEY;
  if (!email || !rawKey) return null;
  if (googleToken && googleToken.expires > Date.now() + 60_000) return googleToken.value;

  // Service-account JWT (RS256) exchanged for an OAuth access token.
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({
    iss: email,
    scope: "https://www.googleapis.com/auth/indexing",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })}`;
  const signature = createSign("RSA-SHA256")
    .update(unsigned)
    .sign(rawKey.replace(/\\n/g, "\n"), "base64url");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`,
    }),
    signal: AbortSignal.timeout(8000),
  });
  const data = (await res.json()) as { access_token?: string; expires_in?: number; error?: string };
  if (!data.access_token) throw new Error(`Google token error: ${data.error ?? res.status}`);
  googleToken = { value: data.access_token, expires: Date.now() + (data.expires_in ?? 3600) * 1000 };
  return googleToken.value;
}

async function pingGoogle(url: string, removed: boolean) {
  try {
    const token = await googleAccessToken();
    if (!token) return;
    const res = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url, type: removed ? "URL_DELETED" : "URL_UPDATED" }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.warn(`[google-indexing] ${res.status} for ${url}: ${(await res.text()).slice(0, 200)}`);
  } catch (err) {
    console.warn("[google-indexing] failed", err);
  }
}
