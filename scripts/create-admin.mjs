#!/usr/bin/env node
/**
 * Create an admin account, or promote / reset the password of an existing one.
 *
 *   node --env-file=.env scripts/create-admin.mjs <email> <password> [name]
 *   npm run create-admin -- <email> <password> [name]
 *
 * Needs SUPABASE_URL and SUPABASE_SECRET_KEY, and the `role` column from
 * supabase/migrations. Also the only way to reset an admin password — admins
 * can't use the email reset flow.
 */
import { randomBytes, scryptSync } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// Set the exit code and let Node exit on its own: calling process.exit()
// with open fetch sockets crashes libuv on Windows.
function fail() {
  process.exitCode = 1;
}

async function main() {
  const [emailArg, password, ...nameParts] = process.argv.slice(2);

  if (!emailArg || !password) {
    console.error("Usage: npm run create-admin -- <email> <password> [name]");
    return fail();
  }

  const email = emailArg.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error(`Invalid email: ${emailArg}`);
    return fail();
  }
  if (password.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    console.error("Password must be 8+ characters with uppercase, lowercase and a number.");
    return fail();
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("SUPABASE_URL and SUPABASE_SECRET_KEY must be set (run with --env-file=.env).");
    return fail();
  }

  // Same format as lib/auth/password.ts → `salt:hash` (hex, scrypt, 64 bytes).
  const salt = randomBytes(16).toString("hex");
  const passwordHash = `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;

  const name =
    nameParts.join(" ").trim() ||
    email.split("@")[0].replace(/^\w/, (c) => c.toUpperCase());

  const sb = createClient(url, key, { auth: { persistSession: false } });

  const { data: existing, error: findError } = await sb
    .from("recruiters")
    .select("id, role")
    .eq("email", email)
    .maybeSingle();

  if (findError) {
    if (/role/.test(findError.message)) {
      console.error("The `role` column is missing. Run `npm run db:migrate` first.");
    } else {
      console.error("Lookup failed:", findError.message);
    }
    return fail();
  }

  const { error } = existing
    ? await sb
        .from("recruiters")
        .update({
          role: "admin",
          password_hash: passwordHash,
          reset_token_hash: null,
          reset_token_expires: null,
        })
        .eq("id", existing.id)
    : await sb
        .from("recruiters")
        .insert({ email, name, role: "admin", password_hash: passwordHash, company: "Joblay" });

  if (error) {
    console.error("Failed:", error.message);
    return fail();
  }

  console.log(existing ? `✅ Updated ${email} → admin (password reset)` : `✅ Created admin ${email}`);
}

await main();
