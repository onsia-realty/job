import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabaseAdmin: SupabaseClient | null = null;

// Server-side Supabase client with service role key (bypasses RLS)
// Lazy initialization to avoid build-time errors when env vars are not set
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_supabaseAdmin) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing Supabase environment variables');
      }
      _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    }
    return (_supabaseAdmin as unknown as Record<string, unknown>)[prop as string];
  },
});

// Upload image buffer to Supabase Storage
export async function uploadImage(
  bucket: string,
  path: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }

  const { data: urlData } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(path);

  return urlData.publicUrl;
}

// Delete image from Supabase Storage
export async function deleteImage(bucket: string, path: string): Promise<void> {
  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    console.error(`Image delete failed: ${error.message}`);
  }
}
