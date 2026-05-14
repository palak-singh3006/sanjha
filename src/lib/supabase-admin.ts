import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { normalizeSupabaseProjectUrl } from "@/lib/supabase-url";

let _admin: SupabaseClient | null = null;

export function isSupabaseServiceConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}

/**
 * Server-only Supabase client (service role). Throws if env is missing.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (_admin) return _admin;

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!rawUrl || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.",
    );
  }

  const { url } = normalizeSupabaseProjectUrl(rawUrl);
  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is empty after normalization.");
  }

  _admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _admin;
}

/** Same as getSupabaseAdmin when URL + service key exist; otherwise null. */
export function getSupabaseAdminOptional(): SupabaseClient | null {
  if (!isSupabaseServiceConfigured()) return null;
  try {
    return getSupabaseAdmin();
  } catch {
    return null;
  }
}
