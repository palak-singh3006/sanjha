import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  formatRouteError,
  hintForFetchFailedToSupabase,
  serializeFetchFailure,
} from "@/lib/api-errors";
import { supabaseProjectRefFromUrl } from "@/lib/supabase-env-check";

/** Minimal Supabase connectivity test from the Next.js server. */
export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const admin = getSupabaseAdmin();

    const { error, count } = await admin.from("listings").select("id", { count: "exact", head: true });

    if (error) {
      return Response.json(
        {
          ok: false,
          step: "postgrest",
          urlHost: url ? new URL(url).host : null,
          urlProjectRef: supabaseProjectRefFromUrl(url),
          error: error.message,
          details: error,
        },
        { status: 502 },
      );
    }

    return Response.json({
      ok: true,
      step: "postgrest",
      urlHost: url ? new URL(url).host : null,
      urlProjectRef: supabaseProjectRefFromUrl(url),
      openListingsCount: count ?? null,
      message: "Server reached Supabase and queried public.listings successfully.",
    });
  } catch (e) {
    const chain = serializeFetchFailure(e);
    const isFetch =
      e instanceof TypeError &&
      (String(e.message).includes("fetch") || chain.toLowerCase().includes("fetch"));

    return Response.json(
      {
        ok: false,
        step: "network_or_tls",
        causeChain: chain || undefined,
        hint: isFetch ? hintForFetchFailedToSupabase() : undefined,
        ...formatRouteError(e),
      },
      { status: 503 },
    );
  }
}
