import { getSupabaseAdminOptional } from "@/lib/supabase-admin";
import { formatRouteError, stringifySupabaseError } from "@/lib/api-errors";
import { placeBidSchema, updateBidStatusSchema } from "@/lib/validations/listing";
import { handleValidationError } from "@/lib/api-response";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = placeBidSchema.safeParse(body);
    if (!parsed.success) {
      return handleValidationError(parsed.error);
    }
    const { listingId, buyerId, pricePerKg, message } = parsed.data;

    const admin = getSupabaseAdminOptional();
    if (!admin) {
      return Response.json({
        id: crypto.randomUUID(),
        listing_id: listingId,
        buyer_id: buyerId || "a1000000-0000-0000-0000-000000000003",
        price_per_kg: pricePerKg,
        message,
        status: "pending",
        isDemo: true,
      });
    }

    const { data: listing } = await admin
      .from("listings")
      .select("min_price")
      .eq("id", listingId)
      .maybeSingle();

    if (!listing) return Response.json({ error: "Listing not found" }, { status: 404 });
    if (pricePerKg < listing.min_price)
      return Response.json(
        { error: `Bid must be at least ₹${listing.min_price}/kg` },
        { status: 400 },
      );

    const { data, error } = await admin
      .from("bids")
      .insert({
        listing_id: listingId,
        buyer_id: buyerId || "a1000000-0000-0000-0000-000000000003",
        price_per_kg: pricePerKg,
        message,
      })
      .select()
      .single();

    if (error) {
      return Response.json({ error: stringifySupabaseError(error), details: error }, { status: 500 });
    }
    return Response.json(data);
  } catch (e) {
    console.error("[api/bids POST]", e);
    return Response.json(formatRouteError(e), { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { bidId, listingId, status = "accepted" } = body;

    if (!bidId || !listingId) {
      return Response.json({ error: "bidId and listingId are required" }, { status: 400 });
    }

    const admin = getSupabaseAdminOptional();
    if (!admin) {
      return Response.json({ success: true, isDemo: true });
    }

    await admin.from("bids").update({ status }).eq("id", bidId);
    if (status === "accepted") {
      await admin.from("bids").update({ status: "rejected" }).eq("listing_id", listingId).neq("id", bidId);
      await admin.from("listings").update({ status: "accepted" }).eq("id", listingId);
    }

    return Response.json({ success: true });
  } catch (e) {
    console.error("[api/bids PATCH]", e);
    return Response.json(formatRouteError(e), { status: 500 });
  }
}
