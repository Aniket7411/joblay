import { isMailConfigured, verifyMailConnection } from "@/lib/mail";
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

  // Database tables
  try {
    const counts: string[] = [];
    for (const table of ["recruiters", "jobs"]) {
      const { count, error } = await withTimeout(
        // Not a HEAD request: those don't report a missing table as an error.
        sb.from(table).select("id", { count: "exact" }).limit(1),
        "Database"
      );
      if (error) throw error;
      counts.push(`${table}: ${count ?? 0}`);
    }
    lines.push({ level: "ok", name: "Supabase DB", detail: `connected to ${host} (${counts.join(", ")})` });
  } catch (err) {
    const code = (err as { code?: string }).code;
    const missing = code === "PGRST205" || code === "42P01" || /schema cache|does not exist/i.test(message(err));
    lines.push({
      level: "fail",
      name: "Supabase DB",
      detail: missing
        ? `${host} reachable but tables are missing — run supabase/schema.sql in the Supabase SQL Editor`
        : `${host}: ${message(err) || "request failed (check SUPABASE_SECRET_KEY)"}`,
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
      detail: "not configured (SMTP_USER / SMTP_PASS) — emails are printed to this console",
    };
  }
  try {
    await withTimeout(verifyMailConnection(), "SMTP");
    return { level: "ok", name: "Email (SMTP)", detail: `signed in as ${process.env.SMTP_USER}` };
  } catch (err) {
    return { level: "fail", name: "Email (SMTP)", detail: `${message(err)} — check SMTP_USER and the Gmail App Password` };
  }
}

function checkAuth(): Line {
  if (process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 32) {
    return { level: "ok", name: "Auth", detail: "AUTH_SECRET set" };
  }
  if (process.env.AUTH_SECRET) {
    return { level: "warn", name: "Auth", detail: "AUTH_SECRET is short — use at least 32 random characters" };
  }
  return {
    level: process.env.NODE_ENV === "production" ? "fail" : "warn",
    name: "Auth",
    detail: "AUTH_SECRET not set — using an insecure dev secret (required in production)",
  };
}

function checkAppUrl(): Line {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (url) return { level: "ok", name: "App URL", detail: url };
  return {
    level: process.env.NODE_ENV === "production" ? "warn" : "ok",
    name: "App URL",
    detail: "NEXT_PUBLIC_APP_URL not set — reset links use the request's host",
  };
}

export async function printStartupStatus() {
  const [supabaseLines, mail] = await Promise.all([checkSupabase(), checkMail()]);
  const lines = [...supabaseLines, mail, checkAuth(), checkAppUrl()];

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
