import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  formatRouteError,
  hintForFetchFailedToSupabase,
  hintForListingsSupabaseError,
  serializeFetchFailure,
  stringifySupabaseError,
} from "@/lib/api-errors";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const crop = req.nextUrl.searchParams.get("crop");
    const admin = getSupabaseAdmin();

    let query = admin.from("listings").select("*").eq("status", "open");

    if (crop) query = query.eq("crop_name", crop);

    let data;
    let error;
    try {
      const result = await query;
      data = result.data;
      error = result.error;
    } catch (e) {
      const chain = serializeFetchFailure(e);
      const isFetch =
        e instanceof TypeError &&
        (String(e.message).includes("fetch") || chain.toLowerCase().includes("fetch"));
      return Response.json(
        {
          causeChain: chain || undefined,
          hint: isFetch
            ? hintForFetchFailedToSupabase()
            : "Unexpected error talking to Supabase from the server.",
          ...formatRouteError(e),
        },
        { status: 503 },
      );
    }

    if (error) {
      return Response.json(
        {
          error: stringifySupabaseError(error),
          hint: hintForListingsSupabaseError(error),
          details: error,
        },
        { status: 500 },
      );
    }
    return Response.json(data ?? []);
  } catch (e) {
    console.error("[api/listings GET]", e);
    return Response.json(formatRouteError(e), { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const admin = getSupabaseAdmin();

    let data;
    let error;
    try {
      const result = await admin
        .from("listings")
        .insert({
          farm_id: body.farmId,
          crop_name: body.cropName,
          quantity_kg: body.quantityKg,
          quality_grade: body.qualityGrade,
          min_price: body.minPrice,
          available_date: body.availableDate,
          location_text: body.locationText,
          lat: body.lat,
          lng: body.lng,
        })
        .select()
        .single();
      data = result.data;
      error = result.error;
    } catch (e) {
      const chain = serializeFetchFailure(e);
      return Response.json(
        {
          causeChain: chain || undefined,
          hint: hintForFetchFailedToSupabase(),
          ...formatRouteError(e),
        },
        { status: 503 },
      );
    }

    if (error) {
      return Response.json(
        {
          error: stringifySupabaseError(error),
          hint: hintForListingsSupabaseError(error),
          details: error,
        },
        { status: 500 },
      );
    }
    return Response.json(data);
  } catch (e) {
    console.error("[api/listings POST]", e);
    return Response.json(formatRouteError(e), { status: 500 });
  }
}
