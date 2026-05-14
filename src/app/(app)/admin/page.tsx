"use client";

import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { adminStats, wastePool } from "@/lib/demo-data";
import { useI18n } from "@/lib/i18n/provider";

const demandTrend = [
  { m: "Jan", t: 32 },
  { m: "Feb", t: 38 },
  { m: "Mar", t: 45 },
  { m: "Apr", t: 52 },
  { m: "May", t: 61 },
];

export default function AdminPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{t("admin_title")}</h1>
        <p className="mt-2 max-w-3xl text-[var(--foreground)]/65">{t("admin_sub")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: t("admin_farmers"), value: adminStats.farmers },
          { label: t("admin_crops"), value: adminStats.crops },
          { label: t("admin_waste"), value: adminStats.wasteTons },
          { label: t("admin_profit"), value: `${adminStats.profitLift}%` },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
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

      <div className="grid gap-4 lg:grid-cols-3">
        <Card glass className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("admin_trend_title")}</CardTitle>
            <CardDescription>{t("admin_trend_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="w-full min-w-0">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={demandTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="m" stroke="rgba(148,163,184,0.5)" />
                <YAxis stroke="rgba(148,163,184,0.5)" />
                <Tooltip
                  contentStyle={{
                    background: "rgba(12,24,20,0.92)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12,
                  }}
                />
                <Bar dataKey="t" fill="url(#gbar)" radius={[10, 10, 0, 0]} />
                <defs>
                  <linearGradient id="gbar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#0f766e" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card glass>
          <CardHeader>
            <CardTitle>{t("admin_top_v_title")}</CardTitle>
            <CardDescription>{t("admin_top_v_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {adminStats.topVillages.map((v, i) => (
              <div
                key={v.name}
                className="flex items-center justify-between rounded-xl border border-[var(--foreground)]/10 px-3 py-2"
              >
                <span className="text-sm">
                  {i + 1}. {v.name}
                </span>
                <span className="font-semibold tabular-nums">{v.score}</span>
              </div>
            ))}
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm">
              {wastePool.message}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
