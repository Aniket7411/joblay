import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client (database + storage).
 *
 * SUPABASE_URL         Project URL
 * SUPABASE_SECRET_KEY  Secret key (sb_secret_...) — bypasses RLS, server only.
 *                      The legacy SUPABASE_SERVICE_ROLE_KEY also works.
 * SUPABASE_STORAGE_BUCKET (optional, default "jd-attachments")
 */

export const ALLOWED_UPLOAD_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
};
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

function secretKey(): string | undefined {
  return (
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && secretKey());
}

export function bucketName(): string {
  return process.env.SUPABASE_STORAGE_BUCKET || "jd-attachments";
}

declare global {
  var supabaseAdmin: SupabaseClient | undefined;
}

/** Admin client. Throws if Supabase is not configured. */
export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }
  global.supabaseAdmin ??= createClient(process.env.SUPABASE_URL!, secretKey()!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return global.supabaseAdmin;
}

/** Creates the public attachments bucket if it doesn't exist yet. */
export async function ensureBucket(): Promise<"exists" | "created"> {
  const supabase = getSupabase();
  const { data } = await supabase.storage.getBucket(bucketName());
  if (data) return "exists";
  const { error } = await supabase.storage.createBucket(bucketName(), {
    public: true,
    fileSizeLimit: MAX_UPLOAD_BYTES,
    allowedMimeTypes: Object.keys(ALLOWED_UPLOAD_TYPES),
  });
  if (error) throw error;
  return "created";
}

/** Uploads a file under the recruiter's folder and returns its public URL. */
export async function uploadAttachment(
  recruiterId: string,
  file: File
): Promise<string> {
  const supabase = getSupabase();
  const ext = ALLOWED_UPLOAD_TYPES[file.type];
  const path = `${recruiterId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const upload = () =>
    supabase.storage.from(bucketName()).upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  let { error } = await upload();
  if (error && /bucket not found/i.test(error.message)) {
    await ensureBucket();
    ({ error } = await upload());
  }
  if (error) throw error;

  return supabase.storage.from(bucketName()).getPublicUrl(path).data.publicUrl;
}

/** True if the URL points at this project's attachment bucket. */
export function isOwnAttachmentUrl(url: string): boolean {
  const base = process.env.SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return false;
  return url.startsWith(`${base}/storage/v1/object/public/${bucketName()}/`);
}
