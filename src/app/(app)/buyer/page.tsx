"use client";

import { Badge } from "@/components/ui/badge";
import { listings } from "@/lib/demo-data";
import { Truck, ShieldCheck, FileCheck, ArrowUpRight } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";

export default function BuyerPage() {
  const { t, tReplace } = useI18n();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[var(--border)] pb-5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-widest text-[var(--muted-foreground)]">
            SANJHA Institutional Procurement
          </span>
          <span className="text-[var(--border-strong)]">·</span>
          <Badge variant="forest" className="text-[10px] py-0 px-2">Verified Contract</Badge>
        </div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl text-[var(--foreground)]">
          {t("buyer_title")}
        </h1>
        <p className="mt-1 text-xs text-[var(--muted-foreground)] max-w-2xl">
          Aggregated bulk farmgate procurement, scheduled dispatch logistics, and transparent quality-graded settlement.
        </p>
      </div>

      {/* KPI Metrics Bar */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
              {t("buyer_rfq")}
            </span>
            <FileCheck className="h-4 w-4 text-[var(--muted-foreground)]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-semibold tabular-nums text-[var(--foreground)]">14</span>
            <span className="text-xs text-[var(--muted-foreground)]">contracts open</span>
          </div>
          <p className="mt-2 text-xs text-[var(--muted-foreground)]">{t("buyer_rfq_desc")}</p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
              {t("buyer_transit")}
            </span>
            <Truck className="h-4 w-4 text-[var(--forest)]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-semibold tabular-nums text-[var(--foreground)]">6</span>
            <span className="text-xs text-[var(--muted-foreground)]">dispatches rolling</span>
          </div>
          <p className="mt-2 text-xs text-[var(--muted-foreground)]">{t("buyer_transit_desc")}</p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
              {t("buyer_fraud")}
            </span>
            <ShieldCheck className="h-4 w-4 text-[var(--leaf)]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-semibold tabular-nums text-[var(--forest)]">0.3%</span>
            <span className="text-xs text-[var(--muted-foreground)]">near-zero dispute</span>
          </div>
          <p className="mt-2 text-xs text-[var(--muted-foreground)]">{t("buyer_fraud_desc")}</p>
        </div>
      </div>

      {/* Procurement Watchlist Table */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
          <div>
            <h2 className="text-base font-semibold text-[var(--foreground)]">{t("buyer_watch_title")}</h2>
            <p className="text-xs text-[var(--muted-foreground)]">{t("buyer_watch_desc")}</p>
          </div>
          <Badge variant="outline" className="text-xs font-mono">
            {listings.length} Lots Active
          </Badge>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[var(--border)] text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">
                <th className="pb-2.5 font-medium">Commodity</th>
                <th className="pb-2.5 font-medium">Cluster Origin</th>
                <th className="pb-2.5 font-medium text-right">Available Volume</th>
                <th className="pb-2.5 font-medium text-right">Target Price</th>
                <th className="pb-2.5 font-medium text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {listings.map((l) => (
                <tr key={l.id} className="hover:bg-[var(--muted)]/30 transition-colors">
                  <td className="py-3 font-semibold text-sm text-[var(--foreground)]">{l.crop}</td>
                  <td className="py-3 text-[var(--muted-foreground)]">{l.farmer}</td>
                  <td className="py-3 text-right font-mono font-medium text-[var(--foreground)] tabular-nums">
                    {l.qty.toLocaleString()} kg ({(l.qty / 1000).toFixed(1)}t)
                  </td>
                  <td className="py-3 text-right">
                    <span className="font-mono font-semibold text-[var(--forest)] tabular-nums">
                      ₹{l.min + 4}/kg
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <Badge variant="forest" className="text-[10px]">
                      {l.trust}% Verified
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
