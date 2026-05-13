"use client";

import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { clusterStats, cropDistribution, harvestRows, wastePool } from "@/lib/demo-data";
import { Sparkles, TrendingUp } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { WasteToWealthPanel } from "@/components/waste-to-wealth/waste-to-wealth-panel";

const demandSupply = [
  { week: "W1", demand: 42, supply: 38 },
  { week: "W2", demand: 48, supply: 55 },
  { week: "W3", demand: 54, supply: 49 },
  { week: "W4", demand: 61, supply: 72 },
  { week: "W5", demand: 58, supply: 44 },
];

export default function DashboardPage() {
  const { t, tReplace } = useI18n();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <motion.h1
            className="text-3xl font-semibold tracking-tight md:text-4xl"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {t("dash_title")}
          </motion.h1>
          <p className="mt-2 max-w-2xl text-[var(--foreground)]/65">
            {clusterStats.village} · {clusterStats.district}. {t("dash_sub")}
          </p>
        </div>
        <Badge variant="gold" className="w-fit gap-1 py-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          {t("dash_badge_cluster")}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: t("dash_stat_farmers"), value: clusterStats.farmers },
          { label: t("dash_stat_crops"), value: clusterStats.activeCrops },
          {
            label: t("dash_stat_tomato"),
            value: `${clusterStats.tomatoSaturation}%`,
          },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Card glass>
              <CardHeader className="pb-2">
                <CardDescription>{s.label}</CardDescription>
                <CardTitle className="text-3xl tabular-nums">{s.value}</CardTitle>
              </CardHeader>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card glass className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              {t("dash_chart_title")}
            </CardTitle>
            <CardDescription>{t("dash_chart_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="h-72 min-h-[18rem] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={demandSupply}>
                <defs>
                  <linearGradient id="d" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="week" stroke="rgba(148,163,184,0.5)" />
                <YAxis stroke="rgba(148,163,184,0.5)" />
                <Tooltip
                  contentStyle={{
                    background: "rgba(12,24,20,0.92)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="demand"
                  stroke="#34d399"
                  fillOpacity={1}
                  fill="url(#d)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="supply"
                  stroke="#fbbf24"
                  fillOpacity={1}
                  fill="url(#s)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card glass className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("dash_ai_title")}</CardTitle>
            <CardDescription>{t("dash_ai_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 to-transparent p-4 text-sm leading-relaxed">
              {clusterStats.aiLine}
            </div>
            <div>
              <p className="mb-2 text-xs uppercase tracking-wider text-[var(--foreground)]/50">
                {t("dash_ai_suggested")}
              </p>
              <p className="font-medium">{clusterStats.suggestedCrop}</p>
            </div>
            <div>
              <p className="mb-2 text-xs uppercase tracking-wider text-[var(--foreground)]/50">
                {t("dash_ai_saturation")}
              </p>
              <Progress value={clusterStats.tomatoSaturation} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card glass>
        <CardHeader>
          <CardTitle>{t("dash_harvest_title")}</CardTitle>
          <CardDescription>{t("dash_harvest_desc")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {harvestRows.map((h, i) => (
            <motion.div
              key={h.farm}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="rounded-2xl border border-[var(--foreground)]/10 bg-[var(--foreground)]/5 p-4"
            >
              <p className="text-sm font-medium">{h.farm}</p>
              <p className="mt-2 text-xs text-[var(--foreground)]/55">{h.weather}</p>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between text-xs uppercase tracking-wider text-[var(--foreground)]/50">
                  <span>{t("dash_risk")}</span>
                  <span>{h.risk}%</span>
                </div>
                <Progress value={h.risk} />
                <div className="flex justify-between text-xs uppercase tracking-wider text-[var(--foreground)]/50">
                  <span>{t("dash_pressure")}</span>
                  <span>{h.marketPressure}%</span>
                </div>
                <Progress value={h.marketPressure} />
              </div>
              <p className="mt-3 text-sm font-semibold text-emerald-600 dark:text-emerald-300">
                {h.date}
              </p>
              <p className="mt-1 text-xs text-[var(--foreground)]/55">
                {t("dash_harvest_ai_prefix")} {(h.confidence * 100).toFixed(0)}% —{" "}
                {t("dash_harvest_ai_suffix")}
              </p>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card glass className="md:col-span-2">
          <CardHeader>
            <CardTitle>{t("dash_waste_title")}</CardTitle>
            <CardDescription>{t("dash_waste_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-4xl font-semibold tabular-nums">{wastePool.qtyTons}t</p>
              <p className="text-sm text-[var(--foreground)]/60">
                {tReplace("dash_waste_recover", {
                  value: (wastePool.valueINR / 1000).toFixed(0),
                  buyers: wastePool.buyersUnlocked,
                })}
              </p>
            </div>
            <div className="max-w-md rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm">
              {wastePool.message}
            </div>
          </CardContent>
        </Card>
        <Card glass>
          <CardHeader>
            <CardTitle>{t("dash_threshold_title")}</CardTitle>
            <CardDescription>
              {tReplace("dash_threshold_desc", { tons: wastePool.threshold })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={Math.min(100, (wastePool.qtyTons / (wastePool.threshold * 1.5)) * 100)} />
          </CardContent>
        </Card>
      </div>

      <WasteToWealthPanel />

      <Card glass>
        <CardHeader>
          <CardTitle>{t("dash_crop_dist_title")}</CardTitle>
          <CardDescription>{t("dash_crop_dist_desc")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-5">
          {cropDistribution.map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-[var(--foreground)]/10 bg-[var(--foreground)]/5 p-4"
            >
              <div className="flex items-center justify-between text-sm">
                <span>{c.name}</span>
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: c.fill }}
                />
              </div>
              <p className="mt-3 text-3xl font-semibold tabular-nums">{c.value}%</p>
              <Progress value={c.value} className="mt-3" />
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
