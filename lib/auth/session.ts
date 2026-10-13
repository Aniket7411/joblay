import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "joblay_session";
/**
 * Readable-by-JS marker so the UI can show signed-in navigation without an
 * API round trip. Carries no identity; the httpOnly session cookie is still
 * what authorizes every request.
 */
export const SIGNED_IN_HINT_COOKIE = "joblay_signed_in";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

interface SessionPayload {
  sub: string; // recruiter id
  exp: number; // unix seconds
}

/**
 * Session signing key: AUTH_SECRET, or else one derived from the Supabase
 * secret key (private, stable, server-only) so sign-in keeps working without
 * extra setup. Setting AUTH_SECRET later signs everyone out once.
 */
function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret) return secret;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseKey) {
    return createHash("sha256").update(`joblay-session:${supabaseKey}`).digest("hex");
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("Set AUTH_SECRET (or Supabase keys) in production");
  }
  return "joblay-dev-secret-change-me";
}

function sign(data: string): string {
  return createHmac("sha256", getSecret()).update(data).digest("base64url");
}

export function createSessionToken(recruiterId: string): string {
  const payload: SessionPayload = {
    sub: recruiterId,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifySessionToken(token: string | undefined): string | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = Buffer.from(sign(body));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString()
    ) as SessionPayload;
    if (!payload.sub || payload.exp < Date.now() / 1000) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

export async function setSessionCookie(recruiterId: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(recruiterId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  store.set(SIGNED_IN_HINT_COOKIE, "1", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(SIGNED_IN_HINT_COOKIE);
}

/** Recruiter id from the signed session cookie, or null. */
export async function getSessionRecruiterId(): Promise<string | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}
