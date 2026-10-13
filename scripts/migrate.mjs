#!/usr/bin/env node
/**
 * Applies pending SQL migrations (supabase/migrations/NNNN_name.sql) in order.
 *
 *   npm run db:migrate            apply pending migrations
 *   npm run db:status             show applied / pending, change nothing
 *
 * Needs SUPABASE_DB_URL (Supabase → Connect → "Session pooler" URI).
 * Also runs automatically before `npm run dev` and `npm run build`:
 *   --optional  skip quietly when SUPABASE_DB_URL isn't set
 *   --soft      report errors but exit 0 (used for dev so the server still starts)
 *
 * Each migration runs in a transaction and records itself in
 * public.schema_migrations; an advisory lock stops parallel runs.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "supabase", "migrations");
const args = new Set(process.argv.slice(2));
const optional = args.has("--optional");
const soft = args.has("--soft");
const statusOnly = args.has("--status");
const LOCK_ID = 74_411_001; // arbitrary, unique to this app

const log = (msg) => console.log(`[db] ${msg}`);

function done(code) {
  // Let Node exit on its own (process.exit with open sockets crashes on Windows).
  process.exitCode = soft ? 0 : code;
}

async function main() {
  const migrations = readdirSync(dir)
    .filter((f) => /^\d{4}_[\w-]+\.sql$/.test(f))
    .sort()
    .map((file) => ({ version: file.slice(0, 4), file, sql: readFileSync(join(dir, file), "utf8") }));

  // The app's expected version must match the newest migration file.
  const expected = readFileSync(join(root, "lib", "schemaVersion.ts"), "utf8").match(/SCHEMA_VERSION = "(\d{4})"/)?.[1];
  const latest = migrations.at(-1)?.version;
  if (expected !== latest) {
    console.error(`[db] lib/schemaVersion.ts says ${expected} but the newest migration is ${latest}. Update SCHEMA_VERSION.`);
    return done(1);
  }

  const url = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  if (!url) {
    if (optional) {
      log("SUPABASE_DB_URL not set — skipping automatic migrations.");
      return done(0);
    }
    console.error("[db] Set SUPABASE_DB_URL (Supabase → Connect → Session pooler URI) and try again.");
    return done(1);
  }

  const { hostname, port } = new URL(url);
  if (port === "6543") {
    log("Warning: port 6543 is the transaction pooler. Use the Session pooler (port 5432) URI for migrations.");
  }
  const local = ["localhost", "127.0.0.1", "::1"].includes(hostname);
  const client = new pg.Client({
    connectionString: url,
    ssl: local ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 15_000,
    application_name: "joblay-migrate",
  });

  try {
    await client.connect();
    await client.query("select pg_advisory_lock($1)", [LOCK_ID]);
    await client.query(`
      create table if not exists public.schema_migrations (
        version text primary key,
        applied_at timestamptz not null default now()
      );
      alter table public.schema_migrations enable row level security;`);
    const { rows } = await client.query("select version from public.schema_migrations");
    const applied = new Set(rows.map((r) => r.version));
    const pending = migrations.filter((m) => !applied.has(m.version));

    if (statusOnly) {
      for (const m of migrations) log(`${applied.has(m.version) ? "✓ applied" : "• pending"}  ${m.file}`);
      return done(0);
    }
    if (pending.length === 0) {
      log(`Schema up to date (${latest}).`);
      return done(0);
    }

    for (const m of pending) {
      log(`Applying ${m.file} ...`);
      try {
        await client.query("begin");
        await client.query(m.sql);
        // Files record themselves; this covers any that don't.
        await client.query(
          "insert into public.schema_migrations (version) values ($1) on conflict (version) do nothing",
          [m.version]
        );
        await client.query("commit");
      } catch (err) {
        await client.query("rollback").catch(() => {});
        console.error(`[db] ${m.file} failed and was rolled back: ${err.message}`);
        return done(1);
      }
    }
    log(`Applied ${pending.length} migration(s). Schema is now ${latest}.`);
    done(0);
  } catch (err) {
    console.error(`[db] Could not run migrations: ${err.message}`);
    if (/^db\..+\.supabase\.co$/.test(hostname)) {
      console.error(
        "[db] This is Supabase's Direct connection, which is IPv6-only. Use the Session pooler URI instead " +
          "(Supabase → Connect → Session pooler; host ends in pooler.supabase.com, port 5432)."
      );
    }
    done(1);
  } finally {
    await client.query("select pg_advisory_unlock($1)", [LOCK_ID]).catch(() => {});
    await client.end().catch(() => {});
  }
}

await main();
