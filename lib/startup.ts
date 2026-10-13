import { isAiEnabled } from "@/lib/ai/parseJd";
import { indexingStatus } from "@/lib/indexing";
import { isMailConfigured, smtpUser, verifyMailConnection } from "@/lib/mail";
import { isTurnstileEnabled } from "@/lib/turnstile";
import { SCHEMA_VERSION } from "@/lib/schemaVersion";
import { isPublicSiteUrl, siteUrl } from "@/lib/siteUrl";
import { bucketName, ensureBucket, getSupabase, isSupabaseConfigured } from "@/lib/supabase";

/**
 * Prints a service status panel once when the server starts.
 * Never prints secret values.
 */

type Level = "ok" | "warn" | "fail";
interface Line {
  level: Level;
  name: string;
  detail: string;
}

const ICON: Record<Level, string> = { ok: "✅", warn: "⚠️ ", fail: "❌" };
const CHECK_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: PromiseLike<T>, label: string): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out`)), CHECK_TIMEOUT_MS)
    ),
  ]);
}

function message(err: unknown): string {
  return err instanceof Error ? err.message : String((err as { message?: string })?.message ?? err);
}

async function checkSupabase(): Promise<Line[]> {
  if (!isSupabaseConfigured()) {
    return [
      {
        level: process.env.NODE_ENV === "production" ? "fail" : "warn",
        name: "Supabase",
        detail: "not configured (SUPABASE_URL / SUPABASE_SECRET_KEY) — using in-memory demo data",
      },
    ];
  }

  const host = new URL(process.env.SUPABASE_URL!).host;
  const lines: Line[] = [];
  const sb = getSupabase();

  // Database: reachable, and schema at the version this code expects.
  try {
    const { data, error } = await withTimeout(
      sb.from("schema_migrations").select("version").order("version", { ascending: false }).limit(1),
      "Database"
    );
    // No tracking table yet = migrations never run through the runner.
    const current = error ? null : (data?.[0]?.version ?? null);
    if (error && !["PGRST205", "42P01"].includes(error.code ?? "")) throw error;

    if (current !== null && current >= SCHEMA_VERSION) {
      const { count } = await withTimeout(sb.from("jobs").select("id", { count: "exact", head: true }), "Database");
      lines.push({ level: "ok", name: "Supabase DB", detail: `${host} · schema ${current} · ${count ?? 0} jobs` });
    } else {
      lines.push({
        level: "fail",
        name: "Supabase DB",
        detail:
          `${host} · schema ${current ?? "untracked"}, app needs ${SCHEMA_VERSION}. ` +
          (process.env.SUPABASE_DB_URL
            ? "Run `npm run db:migrate` (see the [db] lines above for the error)."
            : "Add SUPABASE_DB_URL to .env and restart (applies automatically), or paste the pending files from supabase/migrations into the Supabase SQL Editor."),
      });
    }
  } catch (err) {
    lines.push({
      level: "fail",
      name: "Supabase DB",
      detail: `${host}: ${message(err) || "request failed (check SUPABASE_SECRET_KEY)"}`,
    });
  }

  // Storage bucket
  try {
    const result = await withTimeout(ensureBucket(), "Storage");
    lines.push({
      level: "ok",
      name: "Storage",
      detail: `bucket "${bucketName()}" ${result === "created" ? "created (public)" : "ready"}`,
    });
  } catch (err) {
    lines.push({ level: "warn", name: "Storage", detail: `bucket "${bucketName()}": ${message(err)} — JD uploads will fail` });
  }

  return lines;
}

async function checkMail(): Promise<Line> {
  if (!isMailConfigured()) {
    return {
      level: "warn",
      name: "Email (SMTP)",
      detail: "not configured (EMAIL_USER / EMAIL_PASSWORD) — emails are printed to this console",
    };
  }
  try {
    await withTimeout(verifyMailConnection(), "SMTP");
    return { level: "ok", name: "Email (SMTP)", detail: `signed in as ${smtpUser()}` };
  } catch (err) {
    return { level: "fail", name: "Email (SMTP)", detail: `${message(err)} — check EMAIL_USER and the Gmail App Password (EMAIL_PASSWORD)` };
  }
}

function checkAuth(): Line {
  const secret = process.env.AUTH_SECRET;
  if (secret && secret.length >= 32) return { level: "ok", name: "Auth", detail: "AUTH_SECRET set" };
  if (secret) return { level: "warn", name: "Auth", detail: "AUTH_SECRET is short — use at least 32 random characters" };
  if (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { level: "ok", name: "Auth", detail: "session key derived from the Supabase secret key (set AUTH_SECRET to use your own)" };
  }
  return {
    level: process.env.NODE_ENV === "production" ? "fail" : "warn",
    name: "Auth",
    detail: "AUTH_SECRET not set — using a dev-only secret",
  };
}

/** Optional free APIs: shown as on/off, never as failures. */
function checkOptional(): Line[] {
  const idx = indexingStatus();
  const engines = [idx.indexNow && "IndexNow (Bing etc.)", idx.google && "Google"].filter(Boolean).join(" + ");
  return [
    {
      level: isTurnstileEnabled() ? "ok" : "warn",
      name: "Bot check",
      detail: isTurnstileEnabled()
        ? "Cloudflare Turnstile on (register, login, contact, forgot password)"
        : "off — set NEXT_PUBLIC_TURNSTILE_SITE_KEY + TURNSTILE_SECRET_KEY",
    },
    {
      level: isAiEnabled() ? "ok" : "warn",
      name: "AI auto-fill",
      detail: isAiEnabled()
        ? `Gemini (${process.env.GEMINI_MODEL || "gemini-flash-latest"})`
        : "off — set GEMINI_API_KEY (free at aistudio.google.com)",
    },
    {
      level: engines && idx.siteUrl ? "ok" : "warn",
      name: "Search pings",
      detail: !engines
        ? "off — set INDEXNOW_KEY (and optionally Google Indexing API keys)"
        : idx.siteUrl
          ? `${engines} notified on job changes`
          : `${engines} configured — starts once the site has a public URL`,
    },
  ];
}

function checkAppUrl(): Line {
  const url = siteUrl();
  const source = process.env.NEXT_PUBLIC_APP_URL
    ? "NEXT_PUBLIC_APP_URL"
    : process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? "from Vercel"
      : "default";
  const local = !isPublicSiteUrl(url);
  return {
    level: local && process.env.NODE_ENV === "production" ? "warn" : "ok",
    name: "App URL",
    detail: `${url} (${source})${local && process.env.NODE_ENV === "production" ? " — set NEXT_PUBLIC_APP_URL to your domain" : ""}`,
  };
}

export async function printStartupStatus() {
  const [supabaseLines, mail] = await Promise.all([checkSupabase(), checkMail()]);
  const lines = [...supabaseLines, mail, checkAuth(), checkAppUrl(), ...checkOptional()];

  if (process.env.MONGODB_URI) {
    lines.push({ level: "warn", name: "MongoDB", detail: "MONGODB_URI is set but no longer used — you can remove it from .env" });
  }

  const width = Math.max(...lines.map((l) => l.name.length));
  const body = lines.map((l) => `  ${ICON[l.level]} ${l.name.padEnd(width)}  ${l.detail}`);
  const bar = "─".repeat(Math.min(100, Math.max(...body.map((b) => b.length)) + 2));
  const failed = lines.some((l) => l.level === "fail");

  console.log(
    [
      "",
      bar,
      `  Joblay — service status (${process.env.NODE_ENV})`,
      bar,
      ...body,
      bar,
      failed ? "  Some services failed — the app will not work fully until they're fixed.\n" : "",
    ].join("\n")
  );
}
