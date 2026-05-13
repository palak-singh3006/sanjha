"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { listings } from "@/lib/demo-data";
import { ArrowRight, Gavel, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";

const chainRoles = [
  "market_role_farmer",
  "market_role_broker",
  "market_role_wholesale",
  "market_role_retail",
] as const;

export default function MarketplacePage() {
  const [bid, setBid] = useState<Record<string, string>>({});
  const { t, tReplace } = useI18n();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{t("market_title")}</h1>
        <p className="mt-2 max-w-3xl text-[var(--foreground)]/65">{t("market_sub")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card glass>
          <CardHeader>
            <CardTitle>{t("market_trad_title")}</CardTitle>
            <CardDescription>{t("market_trad_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-2 text-sm">
            {chainRoles.map((key, i) => (
              <span key={key} className="flex items-center gap-2">
                <span className="rounded-lg bg-red-500/15 px-2 py-1 text-red-200">{t(key)}</span>
                {i < chainRoles.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-[var(--foreground)]/40" />
                )}
              </span>
            ))}
          </CardContent>
        </Card>
        <Card glass className="border-emerald-500/25">
          <CardHeader>
            <CardTitle>{t("market_sanj_title")}</CardTitle>
            <CardDescription>{t("market_sanj_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-lg bg-emerald-500/20 px-2 py-1 text-emerald-100">
              {t("market_role_farmer")}
            </span>
            <ArrowRight className="h-4 w-4 text-[var(--foreground)]/40" />
            <span className="rounded-lg bg-amber-400/20 px-2 py-1 text-amber-950 dark:text-amber-100">
              {t("market_label_buyer")}
            </span>
            <Badge variant="gold" className="ml-auto">
              {t("market_uplift")}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {listings.map((l, i) => (
          <motion.div
            key={l.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <Card glass className="h-full">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle>{l.crop}</CardTitle>
                    <CardDescription>{l.farmer}</CardDescription>
                  </div>
                  <Badge variant="secondary" className="gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {tReplace("market_trust_label", { n: l.trust })}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--foreground)]/60">{t("market_qty")}</span>
                  <span className="font-medium">
                    {l.qty} {t("common_unit_kg")}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--foreground)]/60">{t("market_floor")}</span>
                  <span className="font-medium">{tReplace("market_floor_per_kg", { n: l.min })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder={t("market_bid_ph")}
                    value={bid[l.id] ?? ""}
                    onChange={(e) => setBid({ ...bid, [l.id]: e.target.value })}
                  />
                  <Button className="shrink-0">
                    <Gavel className="h-4 w-4" />
                    {t("market_bid")}
                  </Button>
                </div>
                <p className="text-xs text-[var(--foreground)]/50">
                  {tReplace("market_listing_bids", { count: l.bids })}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
