"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  type CommunityInsight,
  type Season,
  SEASONS,
  SEASON_LABELS,
  CONCENTRATION_THRESHOLDS,
  PRIVACY_MIN_FARMERS,
} from "@/features/crop-intelligence/types";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import {
  Users,
  Layers,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
  PlusCircle,
  ListPlus,
  RefreshCw,
  Lightbulb,
} from "lucide-react";

interface CommunityDashboardProps {
  onGoToRegister?: () => void;
  onGoToMyPlans?: () => void;
  refreshTrigger?: number;
}

const CROP_COLORS = ["#244B38", "#72916A", "#B8864B", "#D4A373", "#5B665E", "#8A9A86", "#6F4E37"];

export function CommunityDashboard({
  onGoToRegister,
  onGoToMyPlans,
  refreshTrigger,
}: CommunityDashboardProps) {
  const [village, setVillage] = useState("Hunasagi");
  const [season, setSeason] = useState<Season>("kharif");
  const [villagesList, setVillagesList] = useState<string[]>(["Hunasagi", "Shorapur", "Sindagi"]);
  const [insight, setInsight] = useState<CommunityInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load available villages
  useEffect(() => {
    async function fetchVillages() {
      try {
        const res = await fetch("/api/crop-intelligence/community");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.villages) && data.villages.length > 0) {
            setVillagesList(data.villages);
            if (!village) setVillage(data.defaultVillage || data.villages[0]);
          }
        }
      } catch {
        // use default villages
      }
    }
    fetchVillages();
  }, [village]);

  // Load community insight
  useEffect(() => {
    let active = true;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/crop-intelligence/community?village=${encodeURIComponent(village)}&season=${season}`
        );
        if (res.ok) {
          const data = await res.json();
          if (active) setInsight(data.insight);
        } else {
          const err = await res.json();
          if (active) setError(err.error || "Failed to load community intelligence.");
        }
      } catch {
        if (active) setError("Network error fetching community data.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [village, season, refreshTrigger]);

  function loadCommunityInsight() {
    setLoading(true);
    void (async () => {
      try {
        const res = await fetch(
          `/api/crop-intelligence/community?village=${encodeURIComponent(village)}&season=${season}`
        );
        if (res.ok) {
          const data = await res.json();
          setInsight(data.insight);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }

  function getConcentrationBadge(level: string, pct: number) {
    if (level === "high") {
      return (
        <Badge variant="outline" className="border-amber-700/30 text-amber-800 dark:text-amber-300 bg-amber-500/10">
          High Concentration ({pct}%)
        </Badge>
      );
    }
    if (level === "moderate") {
      return (
        <Badge variant="outline" className="border-amber-600/20 text-amber-700 dark:text-amber-400 bg-amber-500/5">
          Moderate Concentration ({pct}%)
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-[var(--leaf)]/40 text-[var(--forest)] dark:text-[var(--leaf)] bg-[var(--leaf)]/10">
        Balanced Diversification ({pct}%)
      </Badge>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <Card glass>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Village Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]/60">
                Village:
              </span>
              <select
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm font-medium text-[var(--foreground)] outline-none"
              >
                {villagesList.map((v) => (
                  <option key={v} value={v} className="bg-[var(--background)]">
                    {v}
                  </option>
                ))}
              </select>
            </div>

            {/* Season Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]/60">
                Season:
              </span>
              <select
                value={season}
                onChange={(e) => setSeason(e.target.value as Season)}
                className="h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm font-medium text-[var(--foreground)] outline-none"
              >
                {SEASONS.map((s) => (
                  <option key={s} value={s} className="bg-[var(--background)]">
                    {SEASON_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={loadCommunityInsight}
              disabled={loading}
              className="h-9 w-9 p-0"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {onGoToRegister && (
              <Button size="sm" onClick={onGoToRegister} className="gap-1.5 text-xs">
                <PlusCircle className="h-4 w-4" />
                Submit Crop Plan
              </Button>
            )}
            {onGoToMyPlans && (
              <Button size="sm" variant="outline" onClick={onGoToMyPlans} className="gap-1.5 text-xs">
                <ListPlus className="h-4 w-4" />
                My Plans
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-[var(--foreground)]/5 animate-pulse" />
            ))}
          </div>
          <div className="h-72 rounded-2xl bg-[var(--foreground)]/5 animate-pulse" />
        </div>
      ) : insight ? (
        <>
          {/* Key Stat Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card glass>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase font-medium tracking-wider">
                  Total Planned Land
                </CardDescription>
                <CardTitle className="text-3xl font-semibold tabular-nums mt-1">
                  {insight.total_acreage} <span className="text-base font-normal">acres</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-xs text-[var(--foreground)]/60 flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-[var(--forest)] dark:text-[var(--leaf)]" />
                <span>Across all reporting farms</span>
              </CardContent>
            </Card>

            <Card glass>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase font-medium tracking-wider">
                  Reporting Farmers
                </CardDescription>
                <CardTitle className="text-3xl font-semibold tabular-nums mt-1">
                  {insight.participating_farmers}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-xs text-[var(--foreground)]/60 flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-[var(--forest)] dark:text-[var(--leaf)]" />
                <span>In {insight.village} ({SEASON_LABELS[insight.season as Season] || insight.season})</span>
              </CardContent>
            </Card>

            <Card glass>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase font-medium tracking-wider">
                  Dominant Planned Crop
                </CardDescription>
                <CardTitle className="text-2xl font-semibold capitalize mt-1 truncate">
                  {insight.dominant_crop || "None"}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-xs text-[var(--foreground)]/60 flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5 text-[var(--forest)] dark:text-[var(--leaf)]" />
                <span>
                  {insight.concentration_pct > 0
                    ? `${insight.concentration_pct}% of planned land`
                    : "No crop allocated"}
                </span>
              </CardContent>
            </Card>

            <Card glass>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase font-medium tracking-wider">
                  Concentration Level
                </CardDescription>
                <div className="mt-2">
                  {getConcentrationBadge(insight.concentration_level, insight.concentration_pct)}
                </div>
              </CardHeader>
              <CardContent className="pt-0 text-xs text-[var(--foreground)]/60 mt-1">
                <span>Rule: Low (&lt;30%) · Mod (30-49%) · High (≥50%)</span>
              </CardContent>
            </Card>
          </div>

          {/* Privacy Threshold Notice if < 5 farmers */}
          {!insight.meets_privacy_threshold && (
            <Card glass className="border-amber-600/30 bg-amber-500/5">
              <CardContent className="p-4 flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <h4 className="font-semibold text-amber-700 dark:text-amber-300">
                    Privacy Protection Active (Minimum {PRIVACY_MIN_FARMERS} Farmers Required)
                  </h4>
                  <p className="mt-1 text-xs text-[var(--foreground)]/70 leading-relaxed">
                    Currently, only <strong>{insight.participating_farmers}</strong>{" "}
                    {insight.participating_farmers === 1 ? "farmer has" : "farmers have"} registered crop plans for{" "}
                    <strong>{insight.village}</strong> in the {insight.season} season. To protect individual farmer privacy and prevent guessing anyone&apos;s personal planting, community distribution charts will unlock once at least <strong>{PRIVACY_MIN_FARMERS} distinct farmers</strong> contribute.
                  </p>
                  {onGoToRegister && (
                    <Button size="sm" variant="outline" onClick={onGoToRegister} className="mt-3 text-xs">
                      Be among the first to register your plan
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Visuals & Details (shown when privacy threshold met) */}
          {insight.meets_privacy_threshold && insight.crop_stats.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-12">
              {/* Distribution Chart */}
              <Card glass className="lg:col-span-7">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-[var(--forest)] dark:text-[var(--leaf)]" />
                    Crop Acreage Distribution ({insight.village})
                  </CardTitle>
                  <CardDescription>
                    Total planned acres allocated to each crop in the community.
                  </CardDescription>
                </CardHeader>
                <CardContent className="w-full min-w-0">
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={insight.crop_stats} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <XAxis
                          dataKey="crop_name"
                          stroke="var(--muted-foreground)"
                          fontSize={12}
                          tickLine={false}
                          interval={0}
                        />
                        <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            background: "var(--card)",
                            border: "1px solid var(--border)",
                            borderRadius: 8,
                            color: "var(--foreground)",
                            fontSize: 12,
                            boxShadow: "0 1px 3px 0 rgba(0,0,0,0.05)",
                          }}
                          formatter={(value) => [`${value} acres`, "Acreage"]}
                        />
                        <Bar dataKey="total_acreage" radius={[4, 4, 0, 0]}>
                          {insight.crop_stats.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CROP_COLORS[index % CROP_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Clean Crop Breakdown Table */}
                  <div className="mt-4 border-t border-[var(--border)] pt-4 overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-[var(--border)] text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">
                          <th className="pb-2 font-medium">Crop</th>
                          <th className="pb-2 font-medium">Farms</th>
                          <th className="pb-2 font-medium text-right">Acreage</th>
                          <th className="pb-2 font-medium text-right">Community Share</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {insight.crop_stats.map((c, idx) => (
                          <tr key={c.crop_name} className="hover:bg-[var(--muted)]/30 transition-colors">
                            <td className="py-2 flex items-center gap-2">
                              <span
                                className="h-2 w-2 rounded-full shrink-0"
                                style={{ backgroundColor: CROP_COLORS[idx % CROP_COLORS.length] }}
                              />
                              <span className="font-medium text-[var(--foreground)] capitalize">{c.crop_name}</span>
                            </td>
                            <td className="py-2 text-[var(--muted-foreground)] tabular-nums">
                              {c.farmer_count} {c.farmer_count === 1 ? "farm" : "farms"}
                            </td>
                            <td className="py-2 text-right font-mono font-medium text-[var(--foreground)] tabular-nums">
                              {c.total_acreage} ac
                            </td>
                            <td className="py-2 text-right">
                              <span className="font-mono font-semibold text-[var(--forest)] tabular-nums">
                                {c.percentage}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Concentration Analysis & Recommendations */}
              <div className="lg:col-span-5 space-y-4">
                {/* Risk Explanation */}
                <Card glass>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-[var(--gold)]" />
                      Concentration Analysis & Heuristics
                    </CardTitle>
                    <CardDescription className="text-xs">
                      How crop concentration risk is evaluated
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-[var(--foreground)]/60">
                        <span>Dominant Share</span>
                        <span className="font-semibold">{insight.concentration_pct}%</span>
                      </div>
                      <Progress value={Math.min(100, insight.concentration_pct)} />
                      <div className="flex justify-between text-[10px] text-[var(--foreground)]/40 pt-0.5">
                        <span>0%</span>
                        <span>Moderate ({CONCENTRATION_THRESHOLDS.moderate}%)</span>
                        <span>High ({CONCENTRATION_THRESHOLDS.high}%)</span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                      {insight.risk_reasons.map((r, i) => (
                        <p key={i} className="text-xs text-[var(--foreground)]/70 flex items-start gap-1.5 leading-relaxed">
                          <span className="text-[var(--gold)] font-bold">•</span>
                          <span>{r}</span>
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recommendations */}
                <Card glass className="border-[var(--leaf)]/30 bg-[var(--leaf)]/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2 text-[var(--forest)] dark:text-[var(--leaf)]">
                      <Lightbulb className="h-4 w-4 text-[var(--forest)] dark:text-[var(--leaf)]" />
                      Community Diversification Opportunities
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Actionable coordination steps for village farmers
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2.5 text-xs text-[var(--foreground)]/80">
                      {insight.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2 leading-relaxed">
                          <CheckCircle2 className="h-4 w-4 text-[var(--forest)] dark:text-[var(--leaf)] shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center rounded-2xl border border-dashed border-[var(--foreground)]/15 p-6">
              <Layers className="h-10 w-10 text-[var(--foreground)]/30 mx-auto mb-2" />
              <h3 className="text-base font-semibold">No crop plans recorded for this season</h3>
              <p className="mt-1 text-xs text-[var(--foreground)]/60 max-w-sm mx-auto">
                No farmer has submitted plans for {insight.village} ({SEASON_LABELS[insight.season as Season] || insight.season}).
              </p>
              {onGoToRegister && (
                <Button size="sm" onClick={onGoToRegister} className="mt-4 text-xs">
                  Register the first crop plan
                </Button>
              )}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
