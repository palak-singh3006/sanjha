"use client";

import { useState, useEffect, startTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEASONS, SEASON_LABELS, type Season, type FarmOption, type CropPlan } from "@/features/crop-intelligence/types";
import { CheckCircle2, AlertCircle, Loader2, Sparkles } from "lucide-react";

interface CropPlanFormProps {
  onPlanCreated?: (plan: CropPlan) => void;
  editingPlan?: CropPlan | null;
  onCancelEdit?: () => void;
}

export function CropPlanForm({ onPlanCreated, editingPlan, onCancelEdit }: CropPlanFormProps) {
  const [farms, setFarms] = useState<FarmOption[]>([]);
  const [loadingFarms, setLoadingFarms] = useState(true);

  const [farmId, setFarmId] = useState(editingPlan?.farm_id || "");
  const [village, setVillage] = useState(editingPlan?.village || "Hunasagi");
  const [cropName, setCropName] = useState(editingPlan?.crop_name || "");
  const [acreage, setAcreage] = useState(editingPlan ? String(editingPlan.acreage) : "");
  const [season, setSeason] = useState<Season>((editingPlan?.season as Season) || "kharif");
  const [sowingPeriod, setSowingPeriod] = useState(editingPlan?.sowing_period || "Early June");
  const [harvestPeriod, setHarvestPeriod] = useState(editingPlan?.harvest_period || "Mid October");
  const [notes, setNotes] = useState(editingPlan?.notes || "");

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load farmer's farms
  useEffect(() => {
    async function loadFarms() {
      try {
        const res = await fetch("/api/crop-intelligence/farms");
        if (res.ok) {
          const data = await res.json();
          const list: FarmOption[] = data.farms || [];
          setFarms(list);
          if (list.length > 0 && !farmId) {
            setFarmId(list[0].id);
          }
        }
      } catch {
        // demo fallback if API fails
      } finally {
        setLoadingFarms(false);
      }
    }
    loadFarms();
  }, [farmId]);

  // Sync when editingPlan changes
  useEffect(() => {
    if (editingPlan) {
      startTransition(() => {
        setFarmId(editingPlan.farm_id);
        setVillage(editingPlan.village);
        setCropName(editingPlan.crop_name);
        setAcreage(String(editingPlan.acreage));
        setSeason(editingPlan.season as Season);
        setSowingPeriod(editingPlan.sowing_period || "");
        setHarvestPeriod(editingPlan.harvest_period || "");
        setNotes(editingPlan.notes || "");
      });
    }
  }, [editingPlan]);

  const selectedFarm = farms.find((f) => f.id === farmId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validation
    if (!farmId && farms.length > 0) {
      setErrorMessage("Please select a farm.");
      return;
    }
    if (!cropName.trim()) {
      setErrorMessage("Crop name is required.");
      return;
    }
    const acresNum = parseFloat(acreage);
    if (isNaN(acresNum) || acresNum <= 0) {
      setErrorMessage("Please enter a valid acreage greater than 0.");
      return;
    }
    const farmCapacity = selectedFarm?.area_acres ?? selectedFarm?.acres;
    if (farmCapacity && acresNum > Number(farmCapacity)) {
      setErrorMessage(
        `Allocated acreage (${acresNum}) exceeds total farm size (${farmCapacity} acres).`
      );
      return;
    }

    setSubmitting(true);

    const payload = {
      farm_id: farmId || "00000000-0000-0000-0000-000000000001",
      village: village.trim() || "Hunasagi",
      crop_name: cropName.trim(),
      acreage: acresNum,
      season,
      sowing_period: sowingPeriod.trim() || null,
      harvest_period: harvestPeriod.trim() || null,
      notes: notes.trim() || null,
    };

    try {
      const url = editingPlan
        ? `/api/crop-intelligence/plans/${editingPlan.id}`
        : "/api/crop-intelligence/plans";
      const method = editingPlan ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to save crop plan.");
        return;
      }

      setSuccessMessage(
        editingPlan
          ? "Crop plan updated successfully!"
          : "Crop plan registered in community database!"
      );

      if (!editingPlan) {
        setCropName("");
        setAcreage("");
        setNotes("");
      }

      if (onPlanCreated && data.plan) {
        onPlanCreated(data.plan);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg || "Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card glass>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[var(--forest)] dark:text-[var(--leaf)]" />
            {editingPlan ? "Edit Crop Plan" : "Register Crop Plan"}
          </CardTitle>
          <Badge variant="gold">
            {editingPlan ? "Updating" : "New Plan"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-start gap-2">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-lg bg-[var(--leaf)]/10 border border-[var(--leaf)]/30 text-[var(--forest)] dark:text-[var(--leaf)] text-sm flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Farm selection */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-[var(--foreground)]/60 mb-1">
                Your Farm
              </label>
              {loadingFarms ? (
                <div className="h-10 rounded-lg bg-[var(--foreground)]/5 animate-pulse" />
              ) : farms.length > 0 ? (
                <select
                  value={farmId}
                  onChange={(e) => setFarmId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] outline-none"
                >
                  {farms.map((f) => {
                    const displayAcres = f.area_acres ?? f.acres;
                    return (
                      <option key={f.id} value={f.id} className="bg-[var(--background)]">
                        {f.name} ({displayAcres ? `${displayAcres} ac` : "Plot"} - {f.soil_type || "Soil"})
                      </option>
                    );
                  })}
                </select>
              ) : (
                <Input
                  value={farmId}
                  onChange={(e) => setFarmId(e.target.value)}
                  placeholder="Primary Farm Plot A"
                />
              )}
            </div>

            {/* Village */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-[var(--foreground)]/60 mb-1">
                Village / Cluster
              </label>
              <Input
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                placeholder="e.g. Hunasagi"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {/* Crop Name */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-[var(--foreground)]/60 mb-1">
                Crop Name
              </label>
              <Input
                value={cropName}
                onChange={(e) => setCropName(e.target.value)}
                placeholder="e.g. Tomato, Onion, Chilli"
                required
              />
            </div>

            {/* Acreage */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-[var(--foreground)]/60 mb-1">
                Allocated Acreage (Acres)
              </label>
              <Input
                type="number"
                step="0.1"
                min="0.1"
                max="10000"
                value={acreage}
                onChange={(e) => setAcreage(e.target.value)}
                placeholder="e.g. 2.5"
                required
              />
            </div>

            {/* Season */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-[var(--foreground)]/60 mb-1">
                Cropping Season
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
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-[var(--foreground)]/60 mb-1">
                Sowing Period
              </label>
              <Input
                value={sowingPeriod}
                onChange={(e) => setSowingPeriod(e.target.value)}
                placeholder="e.g. Early June / Week 24"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-[var(--foreground)]/60 mb-1">
                Expected Harvest Period
              </label>
              <Input
                value={harvestPeriod}
                onChange={(e) => setHarvestPeriod(e.target.value)}
                placeholder="e.g. Mid October / Week 42"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-[var(--foreground)]/60 mb-1">
              Field Notes / Farming Method (Optional)
            </label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Drip irrigated, Desi organic seeds, intercropped with marigold"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingPlan ? (
                "Update Crop Plan"
              ) : (
                "Save & Submit to Community"
              )}
            </Button>
            {editingPlan && onCancelEdit && (
              <Button type="button" variant="outline" onClick={onCancelEdit}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
