/**
 * Supabase JS expects the API base only: https://YOUR_PROJECT_REF.supabase.co
 */

export type NormalizeResult = {
  url: string;
  correction?: string;
};

export function normalizeSupabaseProjectUrl(raw: string | undefined): NormalizeResult {
  if (!raw?.trim()) {
    return { url: "" };
  }

  let s = raw.trim().replace(/^['"]|['"]$/g, "");

  const dash = s.match(
    /https?:\/\/(?:www\.)?supabase\.com\/dashboard\/project\/([^/\s?#]+)/i,
  );
  if (dash) {
    return {
      url: `https://${dash[1]}.supabase.co`,
      correction:
        "Converted dashboard URL to API URL. Use Project URL from Settings → API.",
    };
  }

  if (!/^https?:\/\//i.test(s)) {
    s = `https://${s}`;
  }

  let u: URL;
  try {
    u = new URL(s);
  } catch {
    return { url: raw.trim(), correction: "Could not parse URL — check for typos." };
  }

  if (u.protocol !== "https:") {
    u.protocol = "https:";
  }

  const host = u.hostname.toLowerCase();

  if (host.endsWith(".supabase.co")) {
    const hadPath = Boolean(u.pathname && u.pathname !== "/");
    const hadRest =
      /\/rest\/v1\/?$/i.test(u.pathname) || u.pathname.includes("/rest/v1/");
    const url = `https://${u.hostname}`;
    if (hadRest || hadPath) {
      return {
        url,
        correction:
          "Removed path from NEXT_PUBLIC_SUPABASE_URL. Use https://YOUR_REF.supabase.co only.",
      };
    }
    return { url };
  }

  const path = u.pathname.replace(/\/+$/, "");
  const base = path && path !== "/" ? `${u.origin}${path}` : u.origin;
  return { url: base };
}
