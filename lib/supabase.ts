import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase Storage (server-side only) for JD attachments.
 *
 * SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_STORAGE_BUCKET
 * The bucket must be public so candidates can open attachments.
 */

export const ALLOWED_UPLOAD_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
};
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function bucketName(): string {
  return process.env.SUPABASE_STORAGE_BUCKET || "jd-attachments";
}

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  client ??= createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
  return client;
}

/** Uploads a file under the recruiter's folder and returns its public URL. */
export async function uploadAttachment(
  recruiterId: string,
  file: File
): Promise<string> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase Storage is not configured");

  const ext = ALLOWED_UPLOAD_TYPES[file.type];
  const path = `${recruiterId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(bucketName())
    .upload(path, await file.arrayBuffer(), {
      contentType: file.type,
      upsert: false,
    });
  if (error) throw error;

  return supabase.storage.from(bucketName()).getPublicUrl(path).data.publicUrl;
}

/** True if the URL points at this project's attachment bucket. */
export function isOwnAttachmentUrl(url: string): boolean {
  const base = process.env.SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return false;
  return url.startsWith(
    `${base}/storage/v1/object/public/${bucketName()}/`
  );
}
