import { createClient } from "@supabase/supabase-js";
import { readFile } from "fs/promises";
import path from "path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY!;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "product-assets";

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

export type StorageFolder = "images" | "documents" | "certificates";

export async function uploadToStorage(
  buffer: Buffer,
  folder: StorageFolder,
  fileName: string,
  contentType: string
): Promise<{ url: string; path: string }> {
  const objectPath = `${folder}/${fileName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(objectPath, buffer, {
      contentType,
      upsert: false,
    });

  if (error) throw new Error(`Supabase upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
  return { url: data.publicUrl, path: objectPath };
}

/**
 * Read a stored file as a Buffer, regardless of whether it's a Supabase
 * public URL (new) or a local /api/files/... path (legacy data).
 */
export async function fetchStoredFile(urlOrPath: string): Promise<Buffer> {
  if (urlOrPath.startsWith("/api/files/")) {
    const relative = urlOrPath.replace("/api/files/", "");
    const fullPath = path.join(process.cwd(), "uploads", relative);
    return readFile(fullPath);
  }

  if (/^https?:\/\//.test(urlOrPath)) {
    const res = await fetch(urlOrPath);
    if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${urlOrPath}`);
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
  }

  throw new Error(`Unsupported file reference: ${urlOrPath}`);
}

/**
 * Strip a public URL back to its in-bucket object path so it can be deleted.
 * Returns null if the URL does not belong to our Supabase bucket.
 */
export function objectPathFromUrl(url: string): string | null {
  const prefix = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`;
  if (!url.startsWith(prefix)) return null;
  return url.slice(prefix.length);
}
