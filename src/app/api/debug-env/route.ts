import { NextResponse } from "next/server";
import { cwd } from "node:process";
import { decodeSupabaseJwtPayload, supabaseProjectRefFromUrl } from "@/lib/supabase-env-check";
import { normalizeSupabaseProjectUrl } from "@/lib/supabase-url";

/** Confirms env vars are visible to the dev server (never exposes secret values). */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const { url: normalizedUrl, correction: urlNormalizationCorrection } = normalizeSupabaseProjectUrl(url);
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const datagov = process.env.DATAGOV_API_KEY?.trim();

  let supabaseUrlHost: string | null = null;
  if (url) {
    try {
      supabaseUrlHost = new URL(url.startsWith("http") ? url : `https://${url}`).host;
    } catch {
      supabaseUrlHost = "(invalid URL)";
    }
  }

  let normalizedSupabaseApiUrlHost: string | null = null;
  if (normalizedUrl) {
    try {
      normalizedSupabaseApiUrlHost = new URL(normalizedUrl).host;
    } catch {
      normalizedSupabaseApiUrlHost = "(invalid)";
    }
  }

  const servicePayload = decodeSupabaseJwtPayload(service);
  const anonPayload = decodeSupabaseJwtPayload(anon);
  const serviceRole = servicePayload?.role;
  const anonRole = anonPayload?.role;

  const refFromUrl = supabaseProjectRefFromUrl(normalizedUrl || url);
  const refFromServiceJwt = servicePayload?.ref as string | undefined;
  const refFromAnonJwt = anonPayload?.ref as string | undefined;

  const serviceKeyMatchesUrl = !refFromUrl || !refFromServiceJwt || refFromServiceJwt === refFromUrl;

  const listingsHints: string[] = [];

  const urlLooksPlaceholder =
    /your-project-id|example\.com|placeholder/i.test(url ?? "") ||
    normalizedSupabaseApiUrlHost === "your-project-id.supabase.co";

  const jwtLooksValid = (k: string | undefined) => Boolean(k && k.startsWith("eyJ") && k.length >= 120);

  if (urlLooksPlaceholder) {
    listingsHints.push(
      'NEXT_PUBLIC_SUPABASE_URL is still the template value. In Supabase → Project Settings → API, copy the real Project URL into .env.local.',
    );
  }
  if (service && !jwtLooksValid(service)) {
    listingsHints.push(
      "SUPABASE_SERVICE_ROLE_KEY does not look like a real Supabase JWT (should start with eyJ).",
    );
  }
  if (anon && !jwtLooksValid(anon)) {
    listingsHints.push("NEXT_PUBLIC_SUPABASE_ANON_KEY should be the long anon public JWT (eyJ...).");
  }

  if (service && serviceRole !== "service_role") {
    listingsHints.push(
      "SUPABASE_SERVICE_ROLE_KEY must be the service_role JWT (not anon). Replace it from Supabase → API.",
    );
  }
  if (refFromUrl && refFromServiceJwt && refFromServiceJwt !== refFromUrl) {
    listingsHints.push(
      `Project mismatch: URL ref "${refFromUrl}" but service_role JWT ref "${refFromServiceJwt}".`,
    );
  }
  if (anon && service && anon === service) {
    listingsHints.push("Anon and service keys must be two different keys from the API settings page.");
  }

  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV,
    serverProcessCwd: cwd(),
    cwdHint: "Run `npm run dev` from the folder that contains package.json and .env.local",
    hasNextPublicSupabaseUrl: Boolean(url),
    supabaseUrlHost,
    normalizedSupabaseApiUrlHost,
    urlNormalizationCorrection: urlNormalizationCorrection ?? null,
    urlProjectRef: refFromUrl,
    hasSupabaseServiceRoleKey: Boolean(service),
    serviceRoleKeyLength: service?.length ?? 0,
    serviceRoleKeyJwtRole: serviceRole ?? "(missing or not a JWT)",
    serviceRoleKeyJwtRef: refFromServiceJwt ?? null,
    serviceKeyProjectMatchesUrl: serviceKeyMatchesUrl,
    anonKeyJwtRole: anonRole ?? "(missing or not a JWT)",
    anonKeyJwtRef: refFromAnonJwt ?? null,
    hasDatagovApiKey: Boolean(datagov),
    looksLikePlaceholderConfig: urlLooksPlaceholder || !jwtLooksValid(service) || !jwtLooksValid(anon),
    listingsHints,
  });
}
