import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFile } from "fs/promises";
import path from "path";

let cachedClient: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (cachedClient) return cachedClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase Storage 未配置: 缺少 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SECRET_KEY"
    );
  }
  cachedClient = createClient(url, key, { auth: { persistSession: false } });
  return cachedClient;
}

function getBucket(): string {
  return process.env.SUPABASE_STORAGE_BUCKET || "product-assets";
}

export type StorageFolder = "images" | "documents" | "certificates";

export async function uploadToStorage(
  buffer: Buffer,
  folder: StorageFolder,
  fileName: string,
  contentType: string
): Promise<{ url: string; path: string }> {
  const objectPath = `${folder}/${fileName}`;
  const bucket = getBucket();
  const client = getClient();

  const { error } = await client.storage
    .from(bucket)
    .upload(objectPath, buffer, {
      contentType,
      upsert: false,
    });

  if (error) throw new Error(`Supabase upload failed: ${error.message}`);

  const { data } = client.storage.from(bucket).getPublicUrl(objectPath);
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
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  const prefix = `${base}/storage/v1/object/public/${getBucket()}/`;
  if (!url.startsWith(prefix)) return null;
  return url.slice(prefix.length);
}
