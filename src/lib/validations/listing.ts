import { z } from "zod";

export const createListingSchema = z.object({
  farmId: z.string().uuid("Invalid farm UUID").optional().nullable(),
  farmerId: z.string().uuid("Invalid farmer UUID").optional(),
  cropName: z.string().min(2, "Crop name required").max(100),
  quantityKg: z.coerce.number().positive("Quantity must be greater than 0"),
  qualityGrade: z.enum(["A", "B", "C"]).default("A"),
  minPrice: z.coerce.number().positive("Minimum price must be greater than 0"),
  availableDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "availableDate must be YYYY-MM-DD")
    .default(() => new Date().toISOString().split("T")[0]),
  locationText: z.string().max(200).optional().nullable(),
  lat: z.coerce.number().min(-90).max(90).optional().nullable(),
  lng: z.coerce.number().min(-180).max(180).optional().nullable(),
  status: z.enum(["open", "pending", "accepted", "completed", "cancelled"]).default("open"),
});

export const placeBidSchema = z.object({
  listingId: z.string().uuid("Invalid listing UUID"),
  buyerId: z.string().uuid("Invalid buyer UUID").optional(),
  pricePerKg: z.coerce.number().positive("Bid price must be greater than 0"),
  message: z.string().max(500).optional().nullable(),
});

export const updateBidStatusSchema = z.object({
  bidId: z.string().uuid("Invalid bid UUID"),
  listingId: z.string().uuid("Invalid listing UUID"),
  status: z.enum(["accepted", "rejected", "withdrawn"]),
});
