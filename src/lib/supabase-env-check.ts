import { Buffer } from "node:buffer";

/** Decode Supabase JWT payload (no signature verify — dev diagnostics only). */
export function decodeSupabaseJwtPayload(jwt: string | undefined): Record<string, unknown> | null {
  if (!jwt?.startsWith("eyJ")) return null;
  try {
    const parts = jwt.split(".");
    if (parts.length < 2) return null;
    const json = Buffer.from(parts[1], "base64url").toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function supabaseProjectRefFromUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const host = new URL(url.trim()).hostname;
    const m = host.match(/^([^.]+)\.supabase\.co$/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}
