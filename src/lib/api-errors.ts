export function formatRouteError(e: unknown) {
  const message = e instanceof Error ? e.message : String(e);
  const cause = e instanceof Error ? e.cause : undefined;
  const causeDetail =
    cause instanceof Error
      ? `${cause.name}: ${cause.message}`
      : cause != null
        ? String(cause)
        : undefined;

  return {
    error: message,
    ...(causeDetail && { cause: causeDetail }),
    ...(process.env.NODE_ENV === "development" && e instanceof Error && { stack: e.stack }),
  };
}

export function serializeFetchFailure(e: unknown): string {
  const parts: string[] = [];
  let cur: unknown = e;
  let depth = 0;
  while (cur != null && depth < 5) {
    if (cur instanceof Error) {
      parts.push(`${cur.name}: ${cur.message}`);
      cur = cur.cause;
    } else {
      parts.push(String(cur));
      break;
    }
    depth++;
  }
  return parts.join(" → ");
}

export function stringifySupabaseError(err: unknown): string {
  if (err == null) return "Unknown error";
  if (typeof err === "string") return err;
  if (typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

export function hintForMarketplaceSupabaseError(details: unknown): string {
  const d = details as { code?: string; message?: string; hint?: string } | null;
  const code = d?.code;
  const msg = (d?.message ?? "").toLowerCase();

  if (
    code === "42P01" ||
    msg.includes("does not exist") ||
    (msg.includes("relation") && msg.includes("marketplace_listings"))
  ) {
    return 'Table "marketplace_listings" is missing. Run supabase/schema.sql in the Supabase SQL editor.';
  }

  if (code === "42501" || msg.includes("permission denied") || msg.includes("row-level security")) {
    return "Blocked by RLS or permissions. Route handlers use SUPABASE_SERVICE_ROLE_KEY (server only).";
  }

  if (code === "PGRST205" || msg.includes("schema cache")) {
    return "PostgREST cannot see this table yet. Confirm public.marketplace_listings exists.";
  }

  if (msg.includes("requested path is invalid") || msg.includes("invalid path")) {
    return "Supabase base URL must be https://YOUR_REF.supabase.co with no /rest/v1 suffix.";
  }

  if (d?.hint) return d.hint;

  return "Check Supabase logs for Postgres/API errors.";
}

/** Guidance when `public.listings` (backend schema) fails via PostgREST. */
export function hintForListingsSupabaseError(details: unknown): string {
  const d = details as { code?: string; message?: string; hint?: string } | null;
  const code = d?.code;
  const msg = (d?.message ?? "").toLowerCase();

  if (
    code === "42P01" ||
    msg.includes("does not exist") ||
    (msg.includes("relation") && msg.includes("listings"))
  ) {
    return 'Table "listings" is missing. Run your Supabase SQL migrations, then retry.';
  }

  if (code === "42501" || msg.includes("permission denied") || msg.includes("row-level security")) {
    return "Blocked by RLS or permissions. Use SUPABASE_SERVICE_ROLE_KEY on the server for admin routes, or add policies for anon/authenticated roles.";
  }

  if (code === "PGRST205" || msg.includes("schema cache")) {
    return "PostgREST cannot see this table. Confirm public.listings exists; reload schema in Supabase if needed.";
  }

  if (msg.includes("requested path is invalid") || msg.includes("invalid path")) {
    return "Supabase base URL must be https://YOUR_REF.supabase.co with no /rest/v1 suffix.";
  }

  if (d?.hint) return d.hint;

  return "Check Supabase → Logs → Postgres / API for details.";
}

export function hintForFetchFailedToSupabase(): string {
  return [
    "Could not reach Supabase (network/TLS).",
    "Confirm NEXT_PUBLIC_SUPABASE_URL and try disabling VPN/SSL inspection.",
    "On Windows: set NODE_OPTIONS=--dns-result-order=ipv4first",
  ].join(" ");
}
