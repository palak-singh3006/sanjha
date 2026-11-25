"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SEASONS, SEASON_LABELS, type Season, type YieldPredictionResult } from "@/features/crop-intelligence/types";
import { BrainCircuit, Loader2, Sparkles, CheckCircle2, AlertCircle, Info } from "lucide-react";

const SUPPORTED_ML_CROPS = [
  "tomato",
  "onion",
  "chilli",
  "rice",
  "wheat",
  "maize",
  "pulses",
  "cotton",
  "potato",
  "sugarcane",
];

const SOIL_TYPES = ["loamy", "black", "clay", "red", "sandy"];

export function YieldPredictionCard() {
  const [crop, setCrop] = useState("tomato");
  const [season, setSeason] = useState<Season>("kharif");
  const [soilType, setSoilType] = useState("black");
  const [rainfallMm, setRainfallMm] = useState("650");
  const [temperatureC, setTemperatureC] = useState("24");
  const [nitrogen, setNitrogen] = useState("120");
  const [phosphorus, setPhosphorus] = useState("60");
  const [potassium, setPotassium] = useState("100");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<YieldPredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePredict(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      crop,
      season,
      soil_type: soilType,
      rainfall_mm: parseFloat(rainfallMm) || 600,
      temperature_c: parseFloat(temperatureC) || 25,
      nitrogen: parseFloat(nitrogen) || 100,
      phosphorus: parseFloat(phosphorus) || 50,
      potassium: parseFloat(potassium) || 80,
    };

    try {
      const res = await fetch("/api/crop-intelligence/predict-yield", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || data.detail || "Prediction request failed.");
        return;
      }

      setResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Failed to contact prediction engine.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card glass>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-[var(--forest)] dark:text-[var(--leaf)]" />
              Machine Learning Crop Yield Estimator (Prototype)
            </CardTitle>
            <CardDescription>
              Experimental model trained on synthetic data. Not validated for real-world yield prediction.
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-amber-700/30 text-amber-800 dark:text-amber-300 bg-amber-500/10 w-fit">
            Experimental Prototype (Synthetic Data)
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Input Form */}
          <form onSubmit={handlePredict} className="lg:col-span-7 space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-[var(--foreground)]/60 mb-1">
                  Crop Species
                </label>
                <select
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] capitalize outline-none"
                >
                  {SUPPORTED_ML_CROPS.map((c) => (
                    <option key={c} value={c} className="bg-[var(--background)] capitalize">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-[var(--foreground)]/60 mb-1">
                  Season
                </label>
                <select
                  value={season}
                  onChange={(e) => setSeason(e.target.value as Season)}
                  className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] outline-none"
                >
                  {SEASONS.map((s) => (
                    <option key={s} value={s} className="bg-[var(--background)]">
                      {SEASON_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-[var(--foreground)]/60 mb-1">
                  Soil Type
                </label>
                <select
                  value={soilType}
                  onChange={(e) => setSoilType(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] capitalize outline-none"
                >
                  {SOIL_TYPES.map((st) => (
                    <option key={st} value={st} className="bg-[var(--background)] capitalize">
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-[var(--foreground)]/60 mb-1">
                  Seasonal Rainfall (mm)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="3500"
                  value={rainfallMm}
                  onChange={(e) => setRainfallMm(e.target.value)}
                  placeholder="e.g. 650"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-[var(--foreground)]/60 mb-1">
                  Average Temperature (°C)
                </label>
                <Input
                  type="number"
                  min="5"
                  max="50"
                  value={temperatureC}
                  onChange={(e) => setTemperatureC(e.target.value)}
                  placeholder="e.g. 24"
                  required
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-[var(--foreground)]/60 mb-1">
                  Nitrogen (N kg/ha)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="300"
                  value={nitrogen}
                  onChange={(e) => setNitrogen(e.target.value)}
                  placeholder="120"
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-[var(--foreground)]/60 mb-1">
                  Phosphorus (P kg/ha)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="200"
                  value={phosphorus}
                  onChange={(e) => setPhosphorus(e.target.value)}
                  placeholder="60"
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-[var(--foreground)]/60 mb-1">
                  Potassium (K kg/ha)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="300"
                  value={potassium}
                  onChange={(e) => setPotassium(e.target.value)}
                  placeholder="100"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running Trained Pipeline...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Predict Yield (ML)
                </>
              )}
            </Button>
          </form>

          {/* Results Output */}
          <div className="lg:col-span-5 flex flex-col justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            {result ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--forest)] dark:text-[var(--leaf)] flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    Prediction Ready
                  </span>
                  <Badge variant="outline" className="text-xs capitalize font-mono">
                    {result.crop}
                  </Badge>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-[var(--foreground)]/50">
                    Estimated Yield
                  </p>
                  <p className="text-3xl font-bold tracking-tight text-[var(--forest)] dark:text-[var(--leaf)] mt-1 tabular-nums">
                    {result.predicted_yield_kg_per_acre.toLocaleString()}{" "}
                    <span className="text-sm font-normal text-[var(--foreground)]/70">
                      kg / acre
                    </span>
                  </p>
                  <p className="text-xs text-[var(--foreground)]/60 mt-0.5">
                    ≈ {(result.predicted_yield_kg_per_acre / 1000).toFixed(2)} metric tons / acre
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-[var(--border)] text-xs">
                  <div className="flex justify-between text-[var(--foreground)]/60">
                    <span>Model Architecture</span>
                    <span className="font-medium text-[var(--foreground)]/90">Gradient Boosting (scikit-learn)</span>
                  </div>
                  <div className="flex justify-between text-[var(--foreground)]/60">
                    <span>Dataset Status</span>
                    <span className="text-[var(--gold)] font-medium">100% Synthetic Data</span>
                  </div>
                </div>

                <div className="text-[11px] space-y-1.5 text-[var(--foreground)]/70 pt-2 border-t border-[var(--border)]">
                  <p className="font-semibold text-amber-800 dark:text-amber-300">
                    Experimental model trained on synthetic data. Not validated for real-world yield prediction.
                  </p>
                  <p className="italic text-[var(--foreground)]/60">
                    Generated programmatically for pipeline mechanics and hackathon demonstration. Neither ICAR nor any government body provided real harvest data.
                  </p>
                </div>
              </div>
            ) : (
              <div className="my-auto text-center py-6">
                <BrainCircuit className="h-10 w-10 text-[var(--foreground)]/30 mx-auto mb-2" />
                <h4 className="text-sm font-semibold">Yield Prediction Result</h4>
                <p className="text-xs text-[var(--foreground)]/50 max-w-xs mx-auto mt-1">
                  Adjust simulated environmental, rainfall, and soil parameters on the left, then click <strong>Predict Yield</strong>.
                </p>
              </div>
            )}

            <div className="mt-4 p-2.5 rounded-lg bg-amber-500/10 border border-amber-600/20 text-amber-800 dark:text-amber-200 text-[11px] flex items-start gap-1.5">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>
                <strong>Mandatory Disclaimer:</strong> Experimental model trained on synthetic data. Not validated for real-world yield prediction. Do not use for actual farm planning.
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
