"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type CropPlan, SEASON_LABELS, type Season } from "@/features/crop-intelligence/types";
import { Trash2, Edit3, Calendar, MapPin, Sparkles, AlertTriangle } from "lucide-react";

interface MyCropPlansProps {
  onEditPlan?: (plan: CropPlan) => void;
  refreshKey?: number;
}

export function MyCropPlans({ onEditPlan, refreshKey }: MyCropPlansProps) {
  const [plans, setPlans] = useState<CropPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/crop-intelligence/plans");
        if (res.ok) {
          const data = await res.json();
          if (active) setPlans(data.plans || []);
        } else {
          if (active) setError("Could not load your crop plans. Please try again.");
        }
      } catch {
        if (active) setError("Network error loading crop plans.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [refreshKey]);

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this crop plan?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/crop-intelligence/plans/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPlans((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert("Failed to delete crop plan.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setDeletingId(null);
    }
  }

  const totalAcreage = plans.reduce((s, p) => s + Number(p.acreage), 0);

  return (
    <Card glass className="border-[var(--foreground)]/15">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-500" />
              My Registered Crop Plans
            </CardTitle>
            <CardDescription>
              Your individual farm crop records stored privately in Supabase.
            </CardDescription>
          </div>
          {plans.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {plans.length} {plans.length === 1 ? "Plan" : "Plans"}
              </Badge>
              <Badge variant="gold" className="text-xs">
                Total: {totalAcreage.toFixed(1)} Acres
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-[var(--foreground)]/5 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : plans.length === 0 ? (
          <div className="py-10 text-center rounded-2xl border border-dashed border-[var(--foreground)]/15 p-6">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
              <Sparkles className="h-6 w-6 text-emerald-500" />
            </div>
            <h3 className="text-base font-semibold">No crop plans registered yet</h3>
            <p className="mt-1 text-xs text-[var(--foreground)]/60 max-w-sm mx-auto">
              Register your intended crops above. Your personal details remain confidential, while contributing to community crop diversity insights.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {plans.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-[var(--foreground)]/10 bg-[var(--foreground)]/5 p-4 flex flex-col justify-between hover:border-emerald-500/30 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-base capitalize">{p.crop_name}</h4>
                      <div className="flex items-center gap-1.5 text-xs text-[var(--foreground)]/60 mt-0.5">
                        <MapPin className="h-3 w-3" />
                        <span>{p.village}</span>
                        <span>·</span>
                        <span className="capitalize">{SEASON_LABELS[p.season as Season] || p.season}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="font-mono text-xs">
                      {p.acreage} ac
                    </Badge>
                  </div>

                  {(p.sowing_period || p.harvest_period) && (
                    <div className="mt-2 text-xs text-[var(--foreground)]/70 flex gap-4">
                      {p.sowing_period && <span>Sowing: {p.sowing_period}</span>}
                      {p.harvest_period && <span>Harvest: {p.harvest_period}</span>}
                    </div>
                  )}

                  {p.notes && (
                    <p className="mt-2 text-xs italic text-[var(--foreground)]/60 border-t border-[var(--foreground)]/10 pt-2">
                      “{p.notes}”
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 mt-4 pt-2 border-t border-[var(--foreground)]/10">
                  {onEditPlan && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEditPlan(p)}
                      className="h-8 px-2 text-xs"
                    >
                      <Edit3 className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={deletingId === p.id}
                    onClick={() => handleDelete(p.id)}
                    className="h-8 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
