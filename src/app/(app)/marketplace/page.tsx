"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { listings as fallbackListings } from "@/lib/demo-data";
import { ArrowRight, Gavel, ShieldCheck, Plus, RefreshCw, TrendingUp, CheckCircle2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { apiMandiSummary } from "@/lib/http/api";

type Listing = {
  id: string;
  crop: string;
  farmer: string;
  qty: number;
  min: number;
  bids: number;
  trust: number;
};

function mapListingRow(r: Record<string, unknown>): Listing {
  return {
    id: String(r.id),
    crop: String(r.crop_name ?? "Produce"),
    farmer: String(r.location_text ?? r.farmer_name ?? "Hunasagi Cluster"),
    qty: Number(r.quantity_kg ?? 0),
    min: Number(r.min_price ?? 0),
    bids: Number(r.bids_count ?? 1),
    trust: 92,
  };
}

const chainRoles = [
  "market_role_farmer",
  "market_role_broker",
  "market_role_wholesale",
  "market_role_retail",
] as const;

// Default to seeded demo buyer if not explicitly set in env
const DEFAULT_BUYER_ID =
  process.env.NEXT_PUBLIC_SANJHA_DEMO_BUYER_USER_ID?.trim() || "a1000000-0000-0000-0000-000000000003";

export default function MarketplacePage() {
  const [bid, setBid] = useState<Record<string, string>>({});
  const [listings, setListings] = useState<Listing[]>(fallbackListings);
  const [source, setSource] = useState<"live" | "demo" | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [cropFilter, setCropFilter] = useState<string>("all");
  const [mandiPrices, setMandiPrices] = useState<any[]>([]);
  const [showCreateListing, setShowCreateListing] = useState(false);
  const [newListing, setNewListing] = useState({
    cropName: "Tomato",
    quantityKg: "1500",
    minPrice: "35",
    locationText: "Hunasagi Mandi Yard",
  });
  const [creating, setCreating] = useState(false);
  const { t, tReplace } = useI18n();

  const load = useCallback(async () => {
    setLoading(true);
    setNotice(null);
    try {
      const [res, mandiRes] = await Promise.all([
        fetch("/api/listings", { cache: "no-store" }),
        apiMandiSummary("Karnataka").catch(() => null),
      ]);

      const raw = await res.json();
      if (!res.ok) {
        setListings(fallbackListings);
        setSource("demo");
        return;
      }
      const rows = Array.isArray(raw) ? raw : [];
      if (rows.length) {
        setListings(rows.map((row) => mapListingRow(row as Record<string, unknown>)));
        setSource("live");
      } else {
        setListings(fallbackListings);
        setSource("demo");
      }

      if (mandiRes?.data?.commodities) {
        setMandiPrices(mandiRes.data.commodities);
      }
    } catch {
      setListings(fallbackListings);
      setSource("demo");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function submitBid(listing: Listing) {
    const raw = bid[listing.id]?.trim();
    const price = raw ? Number(raw) : NaN;
    if (!Number.isFinite(price) || price <= 0) {
      setNotice("Enter a valid bid amount (₹/kg).");
      return;
    }
    if (price < listing.min) {
      setNotice(`Bid must be at least ₹${listing.min}/kg.`);
      return;
    }

    setSubmittingId(listing.id);
    setNotice(null);
    try {
      const res = await fetch("/api/bids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          buyerId: DEFAULT_BUYER_ID,
          pricePerKg: price,
          message: "Procurement bid placed via SANJHA marketplace",
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setNotice(data.error ?? "Bid failed.");
        return;
      }

      setNotice(`Bid of ₹${price}/kg placed successfully on ${listing.crop}!`);
      setListings((prev) =>
        prev.map((item) => (item.id === listing.id ? { ...item, bids: item.bids + 1 } : item)),
      );
      setBid((b) => ({ ...b, [listing.id]: "" }));
    } catch {
      setNotice("Network error placing bid.");
    } finally {
      setSubmittingId(null);
    }
  }

  async function handleCreateListing(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setNotice(null);
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cropName: newListing.cropName,
          quantityKg: Number(newListing.quantityKg),
          qualityGrade: "A",
          minPrice: Number(newListing.minPrice),
          locationText: newListing.locationText,
          availableDate: new Date().toISOString().split("T")[0],
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setNotice(err.error || "Failed to create listing.");
        return;
      }

      setNotice(`Successfully posted listing for ${newListing.cropName}!`);
      setShowCreateListing(false);
      await load();
    } catch {
      setNotice("Error submitting new listing.");
    } finally {
      setCreating(false);
    }
  }

  const filteredListings = listings.filter((l) =>
    cropFilter === "all" ? true : l.crop.toLowerCase().includes(cropFilter.toLowerCase()),
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[var(--muted-foreground)]">
              SANJHA Direct Exchange
            </span>
            <span className="text-[var(--border-strong)]">·</span>
            <Badge variant="forest" className="text-[10px] py-0 px-2">Zero Intermediary</Badge>
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl text-[var(--foreground)]">
            {t("market_title")}
          </h1>
          <p className="mt-1 text-xs text-[var(--muted-foreground)] max-w-2xl">{t("market_sub")}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            disabled={loading}
            className="h-8 gap-1.5 text-xs border-[var(--border)]"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin text-[var(--forest)]" : "text-[var(--muted-foreground)]"}`} />
            Live Sync
          </Button>

          <Button
            size="sm"
            onClick={() => setShowCreateListing(!showCreateListing)}
            className="h-8 gap-1.5 text-xs bg-[var(--forest)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]"
          >
            <Plus className="h-3.5 w-3.5" />
            Post Crop Lot
          </Button>
        </div>
      </div>

      {/* APMC Mandi Real-Time Benchmark Ticker */}
      {mandiPrices.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--forest)]">
              <TrendingUp className="h-4 w-4" />
              <span>APMC Live Benchmarks (Karnataka Mandis)</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs">
              {mandiPrices.slice(0, 4).map((c) => (
                <span key={c.cropName} className="flex items-center gap-1.5">
                  <span className="font-medium text-[var(--muted-foreground)]">{c.cropName}:</span>
                  <span className="font-mono font-semibold text-[var(--foreground)]">
                    ₹{c.modalPriceAvg}/q (₹{(c.modalPriceAvg / 100).toFixed(1)}/kg)
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {notice && (
        <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--muted)]/60 px-4 py-2.5 text-xs font-medium text-[var(--foreground)]">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--forest)]" />
          <span>{notice}</span>
        </div>
      )}

      {/* Interactive Create Listing Drawer */}
      {showCreateListing && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <div className="pb-3 border-b border-[var(--border)]">
              <h2 className="text-base font-semibold text-[var(--foreground)]">Publish Produce Lot to Collective Market</h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                Direct buyer connection with zero broker deductions. Floor price is guaranteed.
              </p>
            </div>
            <form onSubmit={handleCreateListing} className="mt-4 grid gap-3 sm:grid-cols-4">
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">Crop Commodity</label>
                <Input
                  className="mt-1 h-8 text-xs"
                  value={newListing.cropName}
                  onChange={(e) => setNewListing({ ...newListing, cropName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">Lot Quantity (kg)</label>
                <Input
                  className="mt-1 h-8 text-xs font-mono"
                  type="number"
                  value={newListing.quantityKg}
                  onChange={(e) => setNewListing({ ...newListing, quantityKg: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">Min Floor Price (₹/kg)</label>
                <Input
                  className="mt-1 h-8 text-xs font-mono"
                  type="number"
                  step="0.5"
                  value={newListing.minPrice}
                  onChange={(e) => setNewListing({ ...newListing, minPrice: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">Pickup Yard / Location</label>
                <Input
                  className="mt-1 h-8 text-xs"
                  value={newListing.locationText}
                  onChange={(e) => setNewListing({ ...newListing, locationText: e.target.value })}
                  required
                />
              </div>
              <div className="sm:col-span-4 flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setShowCreateListing(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={creating} className="h-8 text-xs bg-[var(--forest)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]">
                  {creating ? "Submitting..." : "Publish Live Listing"}
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      )}

      {/* Traditional vs Sanjha Supply Chain Comparison */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="pb-2">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">{t("market_trad_title")}</h3>
            <p className="text-xs text-[var(--muted-foreground)]">{t("market_trad_desc")}</p>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            {chainRoles.map((key, i) => (
              <span key={key} className="flex items-center gap-2">
                <span className="rounded bg-[var(--background)] border border-[var(--border)] px-2.5 py-1 font-medium text-[var(--muted-foreground)]">{t(key)}</span>
                {i < chainRoles.length - 1 && (
                  <ArrowRight className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                )}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--forest)]/30 bg-[var(--muted)]/40 p-4">
          <div className="pb-2">
            <h3 className="text-sm font-semibold text-[var(--forest)]">{t("market_sanj_title")}</h3>
            <p className="text-xs text-[var(--muted-foreground)]">{t("market_sanj_desc")}</p>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded bg-[var(--forest)] text-[var(--primary-foreground)] px-2.5 py-1 font-medium">
              {t("market_role_farmer")}
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-[var(--forest)]" />
            <span className="rounded bg-[var(--card)] border border-[var(--border)] px-2.5 py-1 font-medium text-[var(--foreground)]">
              {t("market_label_buyer")}
            </span>
            <Badge variant="gold" className="ml-auto text-xs">
              {t("market_uplift")}
            </Badge>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-[var(--muted-foreground)]">Commodity:</span>
        {["all", "Tomato", "Onion", "Chilli"].map((crop) => (
          <Button
            key={crop}
            variant={cropFilter === crop ? "default" : "outline"}
            size="sm"
            className="h-7 px-3 text-xs capitalize rounded-md border-[var(--border)]"
            onClick={() => setCropFilter(crop)}
          >
            {crop === "all" ? "All Commodities" : crop}
          </Button>
        ))}
      </div>

      {/* Live Listings Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {filteredListings.map((l, i) => (
          <motion.div
            key={l.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="h-full flex flex-col justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 hover:border-[var(--forest)]/40 transition-colors">
              <div>
                <div className="flex items-start justify-between gap-2 border-b border-[var(--border)] pb-3">
                  <div>
                    <h3 className="text-base font-semibold text-[var(--foreground)]">{l.crop}</h3>
                    <p className="text-xs text-[var(--muted-foreground)]">{l.farmer}</p>
                  </div>
                  <Badge variant="secondary" className="gap-1 text-[11px]">
                    <ShieldCheck className="h-3 w-3 text-[var(--forest)]" />
                    {tReplace("market_trust_label", { n: l.trust })}
                  </Badge>
                </div>

                <div className="mt-4 space-y-2.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--muted-foreground)]">{t("market_qty")}</span>
                    <span className="font-mono font-medium text-[var(--foreground)] tabular-nums">
                      {l.qty.toLocaleString("en-IN")} {t("common_unit_kg")} ({(l.qty / 1000).toFixed(1)}t)
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--muted-foreground)]">{t("market_floor")}</span>
                    <span className="font-mono font-semibold text-[var(--forest)] tabular-nums">
                      {tReplace("market_floor_per_kg", { n: l.min })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Input
                      placeholder={t("market_bid_ph")}
                      value={bid[l.id] ?? ""}
                      className="h-8 text-xs font-mono"
                      onChange={(e) => setBid({ ...bid, [l.id]: e.target.value })}
                    />
                    <Button
                      size="sm"
                      className="h-8 shrink-0 text-xs bg-[var(--forest)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)]"
                      disabled={submittingId === l.id}
                      onClick={() => void submitBid(l)}
                    >
                      <Gavel className="h-3.5 w-3.5 mr-1" />
                      {t("market_bid")}
                    </Button>
                  </div>
                  <p className="text-[11px] text-[var(--muted-foreground)] pt-1">
                    {tReplace("market_listing_bids", { count: l.bids })}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
