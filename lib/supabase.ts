/**
 * Supabase Storage client — configure via .env when ready.
 *
 * SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_STORAGE_BUCKET
 */

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY
  );
}

export async function getSupabaseClient() {
  if (!isSupabaseConfigured()) return null;
  // TODO: createClient(supabaseUrl, supabaseAnonKey) when env is provided
  return null;
}
