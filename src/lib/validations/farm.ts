import { z } from "zod";

export const createFarmSchema = z.object({
  ownerId: z.string().uuid("Invalid owner UUID").optional(),
  groupId: z.string().uuid("Invalid group UUID").optional().nullable(),
  name: z.string().min(2, "Farm name must be at least 2 characters").max(120),
  acres: z.coerce.number().positive("Acres must be greater than 0").max(10000),
  village: z.string().min(2).max(100).default("Hunasagi"),
  district: z.string().min(2).max(100).default("Yadgir"),
  state: z.string().min(2).max(100).default("Karnataka"),
  soilType: z.enum(["loamy", "clay", "sandy", "red", "black"]).default("loamy"),
  surveyNumber: z.string().max(60).optional().nullable(),
  irrigationType: z.string().max(60).default("drip"),
  lat: z.coerce.number().min(-90).max(90).default(16.45),
  lng: z.coerce.number().min(-180).max(180).default(76.45),
});

export const updateFarmSchema = createFarmSchema.partial();
