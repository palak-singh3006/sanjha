import { getSupabaseAdminOptional } from "@/lib/supabase-admin";
import {
  formatRouteError,
  hintForFetchFailedToSupabase,
  hintForListingsSupabaseError,
  serializeFetchFailure,
  stringifySupabaseError,
} from "@/lib/api-errors";
import { createListingSchema } from "@/lib/validations/listing";
import { handleValidationError } from "@/lib/api-response";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const crop = req.nextUrl.searchParams.get("crop");
    const admin = getSupabaseAdminOptional();

    if (!admin) {
      // Demo fallback listings matching frontend structure
      const demoListings = [
        {
          id: "e1000000-0000-0000-0000-000000000001",
          crop_name: "Tomato",
          quantity_kg: 2500,
          quality_grade: "A",
          min_price: 34.0,
          available_date: new Date(Date.now() + 12 * 86400000).toISOString().split("T")[0],
          location_text: "Hunasagi Mandi Yard",
          status: "open",
          farmer_name: "Sharanappa Gowda",
          bids_count: 1,
        },
        {
          id: "e1000000-0000-0000-0000-000000000002",
          crop_name: "Onion",
          quantity_kg: 4000,
          quality_grade: "A",
          min_price: 28.5,
          available_date: new Date(Date.now() + 25 * 86400000).toISOString().split("T")[0],
          location_text: "Hunasagi Mandi Yard",
          status: "open",
          farmer_name: "Sharanappa Gowda",
          bids_count: 0,
        },
      ];
      if (crop) {
        return Response.json(
          demoListings.filter((l) => l.crop_name.toLowerCase().includes(crop.toLowerCase())),
        );
      }
      return Response.json(demoListings);
    }

    let query = admin.from("listings").select("*").eq("status", "open");
    if (crop) query = query.ilike("crop_name", `%${crop}%`);

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
    const parsed = createListingSchema.safeParse(body);
    if (!parsed.success) {
      return handleValidationError(parsed.error);
    }
    const val = parsed.data;

    const admin = getSupabaseAdminOptional();
    if (!admin) {
      return Response.json({
        id: crypto.randomUUID(),
        farm_id: val.farmId,
        crop_name: val.cropName,
        quantity_kg: val.quantityKg,
        quality_grade: val.qualityGrade,
        min_price: val.minPrice,
        available_date: val.availableDate,
        location_text: val.locationText,
        lat: val.lat,
        lng: val.lng,
        status: val.status,
        isDemo: true,
      });
    }

    let data;
    let error;
    try {
      const result = await admin
        .from("listings")
        .insert({
          farm_id: val.farmId,
          farmer_id: val.farmerId || "a1000000-0000-0000-0000-000000000001",
          crop_name: val.cropName,
          quantity_kg: val.quantityKg,
          quality_grade: val.qualityGrade,
          min_price: val.minPrice,
          available_date: val.availableDate,
          location_text: val.locationText,
          lat: val.lat,
          lng: val.lng,
          status: val.status,
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
