import { z } from "zod";

export const farmerProfileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(120),
  phone: z
    .string()
    .regex(/^(\+91[\s-]?)?[6789][0-9\s-]{8,11}\d$/, "Invalid Indian phone number")
    .optional()
    .nullable(),
  email: z.string().email("Invalid email address").optional().nullable(),
  role: z.enum(["farmer", "buyer", "coordinator", "admin"]).default("farmer"),
  preferredLanguage: z.enum(["en", "kn", "hi", "te", "ta", "mr", "pa"]).default("kn"),
  village: z.string().min(2).max(100).default("Hunasagi"),
  district: z.string().min(2).max(100).default("Yadgir"),
  state: z.string().min(2).max(100).default("Karnataka"),
  experienceYears: z.coerce.number().int().min(0).max(80).default(5),
  totalLandAcres: z.coerce.number().positive("Land acres must be positive").default(3.5),
  primaryCrops: z.array(z.string()).min(1, "At least one primary crop required").default(["Tomato", "Onion"]),
  hasIrrigation: z.boolean().default(true),
  irrigationSources: z.array(z.string()).default(["borewell", "drip"]),
  kycStatus: z.enum(["pending", "verified", "rejected"]).default("verified"),
  aadhaarLast4: z.string().regex(/^\d{4}$/, "Must be 4 digits").optional().nullable(),
  upiId: z.string().regex(/^[\w.-]+@[\w.-]+$/, "Invalid UPI ID").optional().nullable(),
  annualIncomeRange: z.string().optional().nullable(),
  cooperativeName: z.string().max(150).optional().nullable(),
});

export const updateFarmerProfileSchema = farmerProfileSchema.partial();
