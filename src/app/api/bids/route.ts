import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { formatRouteError, stringifySupabaseError } from "@/lib/api-errors";

export async function POST(req: Request) {
  try {
    const { listingId, buyerId, pricePerKg, message } = await req.json();
    const admin = getSupabaseAdmin();

    const { data: listing } = await admin
      .from("listings")
      .select("min_price")
      .eq("id", listingId)
      .single();

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
        buyer_id: buyerId,
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
    const { bidId, listingId } = await req.json();
    const admin = getSupabaseAdmin();

    await admin.from("bids").update({ status: "accepted" }).eq("id", bidId);
    await admin.from("bids").update({ status: "rejected" }).eq("listing_id", listingId).neq("id", bidId);
    await admin.from("listings").update({ status: "accepted" }).eq("id", listingId);

    return Response.json({ success: true });
  } catch (e) {
    console.error("[api/bids PATCH]", e);
    return Response.json(formatRouteError(e), { status: 500 });
  }
}
