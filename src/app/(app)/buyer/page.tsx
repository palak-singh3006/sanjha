"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listings } from "@/lib/demo-data";
import { Truck } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";

export default function BuyerPage() {
  const { t, tReplace } = useI18n();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{t("buyer_title")}</h1>
        <p className="mt-2 max-w-3xl text-[var(--foreground)]/65">{t("buyer_sub")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card glass>
          <CardHeader>
            <CardTitle>{t("buyer_rfq")}</CardTitle>
            <CardDescription>{t("buyer_rfq_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="text-4xl font-semibold">14</CardContent>
        </Card>
        <Card glass>
          <CardHeader>
            <CardTitle>{t("buyer_transit")}</CardTitle>
            <CardDescription>{t("buyer_transit_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-4xl font-semibold">
            6 <Truck className="h-8 w-8 text-emerald-400" />
          </CardContent>
        </Card>
        <Card glass>
          <CardHeader>
            <CardTitle>{t("buyer_fraud")}</CardTitle>
            <CardDescription>{t("buyer_fraud_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="text-4xl font-semibold text-emerald-400">0.3%</CardContent>
        </Card>
      </div>

      <Card glass>
        <CardHeader>
          <CardTitle>{t("buyer_watch_title")}</CardTitle>
          <CardDescription>{t("buyer_watch_desc")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {listings.map((l) => (
            <div
              key={l.id}
              className="rounded-2xl border border-[var(--foreground)]/10 bg-[var(--foreground)]/5 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{l.crop}</p>
                <Badge variant="secondary">{tReplace("market_trust_label", { n: l.trust })}</Badge>
              </div>
              <p className="mt-2 text-sm text-[var(--foreground)]/60">{l.farmer}</p>
              <p className="mt-3 text-sm">
                {tReplace("buyer_target_line", {
                  price: l.min + 4,
                  qty: l.qty,
                  unit: t("common_unit_kg"),
                })}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
