/**
 * Gemini layer for soil module — short, farmer-facing language.
 * Uses GEMINI_API_KEY; model id overridable via GEMINI_SOIL_MODEL (default gemini-1.5-flash).
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { SoilEngineResult, SoilGeminiInsights } from "@/types/soil";

const DEFAULT_MODEL = process.env.GEMINI_SOIL_MODEL?.trim() || "gemini-1.5-flash";

export async function enhanceSoilWithGemini(
  input: {
    previousCrop: string;
    soilType: string;
    farmingMethod: string;
    weeksSinceHarvest: number;
  },
  engine: SoilEngineResult,
): Promise<{ text: string; parsed: SoilGeminiInsights | null }> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    return { text: "", parsed: null };
  }

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });

  const prompt = `You advise smallholder farmers in India. Reply ONLY with valid JSON, no markdown, no code fences.
Keys exactly:
{
  "stress_explanation": "one short sentence",
  "sustainable_next_crops": "comma-separated 2-3 crops, practical",
  "intercropping_idea": "one short sentence",
  "recovery_strategies": "2 short sentences max",
  "low_cost_organic": "2 short sentences max"
}

Context:
Previous crop: ${input.previousCrop}
Soil type: ${input.soilType}
Farming method: ${input.farmingMethod}
Weeks since harvest: ${input.weeksSinceHarvest}
Heuristic scores (0-100, higher=worse): N ${engine.nitrogen_score}, P ${engine.phosphorus_score}, K ${engine.potassium_score}, stress ${engine.stress_score}
Recovery weeks estimate: ${engine.recovery_weeks}
Recommended next crop (heuristic): ${engine.recommended_crop}
Rotation note: ${engine.rotation_rationale}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const parsed = safeParseInsights(text);
    return { text, parsed };
  } catch {
    return { text: "", parsed: null };
  }
}

function safeParseInsights(raw: string): SoilGeminiInsights | null {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    const o = JSON.parse(cleaned) as Record<string, unknown>;
    return {
      stress_explanation: String(o.stress_explanation ?? ""),
      sustainable_next_crops: String(o.sustainable_next_crops ?? ""),
      intercropping_idea: String(o.intercropping_idea ?? ""),
      recovery_strategies: String(o.recovery_strategies ?? ""),
      low_cost_organic: String(o.low_cost_organic ?? ""),
    };
  } catch {
    return null;
  }
}

export function formatGeminiAdvisory(parsed: SoilGeminiInsights | null): string | null {
  if (!parsed) return null;
  const parts = [
    parsed.stress_explanation && `Stress: ${parsed.stress_explanation}`,
    parsed.sustainable_next_crops && `Crops: ${parsed.sustainable_next_crops}`,
    parsed.intercropping_idea && `Intercrop: ${parsed.intercropping_idea}`,
    parsed.recovery_strategies && `Recovery: ${parsed.recovery_strategies}`,
    parsed.low_cost_organic && `Low-cost organic: ${parsed.low_cost_organic}`,
  ].filter(Boolean);
  return parts.length ? parts.join(" ") : null;
}

/** Lightweight AI blurb for GET /api/soil/recommendations (static + optional Gemini). */
export async function supplementStaticRecommendation(
  crop: string,
  soil: string,
  staticSummary: string,
): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) return null;

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });
  const prompt = `Farmer in India. Static advice: ${staticSummary}
Crop context: ${crop}, soil: ${soil}.
Reply with 2–3 very short sentences only. No JSON. Practical, low-cost, sustainable. Simple English (a few Kannada words OK).`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim() || null;
  } catch {
    return null;
  }
}
