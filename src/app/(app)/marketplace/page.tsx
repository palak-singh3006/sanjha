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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{t("market_title")}</h1>
          <p className="mt-2 max-w-3xl text-[var(--foreground)]/65">{t("market_sub")}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
            Live Sync
          </Button>

          <Button
            size="sm"
            onClick={() => setShowCreateListing(!showCreateListing)}
            className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500"
          >
            <Plus className="h-4 w-4" />
            Post Crop Lot
          </Button>
        </div>
      </div>

      {/* APMC Mandi Real-Time Benchmark Ticker */}
      {mandiPrices.length > 0 && (
        <div className="rounded-2xl border border-[var(--foreground)]/10 bg-[var(--foreground)]/5 p-3 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" />
              <span>Live APMC Benchmarks (Karnataka)</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs">
              {mandiPrices.slice(0, 4).map((c) => (
                <span key={c.cropName} className="flex items-center gap-1.5">
                  <span className="font-medium text-[var(--foreground)]/80">{c.cropName}:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-300">
                    ₹{c.modalPriceAvg}/quintal (₹{(c.modalPriceAvg / 100).toFixed(1)}/kg)
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {notice && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-700 dark:text-emerald-200">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
          <span>{notice}</span>
        </div>
      )}

      {/* Interactive Create Listing Drawer */}
      {showCreateListing && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card glass className="border-emerald-500/30 bg-emerald-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Publish Produce Lot to Collective Market</CardTitle>
              <CardDescription>
                Direct buyer connection with zero broker deductions. Floor price is guaranteed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateListing} className="grid gap-3 sm:grid-cols-4">
                <div>
                  <label className="text-xs text-[var(--foreground)]/60">Crop Commodity</label>
                  <Input
                    className="mt-1"
                    value={newListing.cropName}
                    onChange={(e) => setNewListing({ ...newListing, cropName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--foreground)]/60">Lot Quantity (kg)</label>
                  <Input
                    className="mt-1"
                    type="number"
                    value={newListing.quantityKg}
                    onChange={(e) => setNewListing({ ...newListing, quantityKg: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--foreground)]/60">Min Floor Price (₹/kg)</label>
                  <Input
                    className="mt-1"
                    type="number"
                    step="0.5"
                    value={newListing.minPrice}
                    onChange={(e) => setNewListing({ ...newListing, minPrice: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--foreground)]/60">Pickup Yard / Location</label>
                  <Input
                    className="mt-1"
                    value={newListing.locationText}
                    onChange={(e) => setNewListing({ ...newListing, locationText: e.target.value })}
                    required
                  />
                </div>
                <div className="sm:col-span-4 flex justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowCreateListing(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={creating} className="bg-emerald-600 text-white hover:bg-emerald-700">
                    {creating ? "Submitting..." : "Publish Live Listing"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Traditional vs Sanjha Comparison */}
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

      {/* Filter Bar */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-[var(--foreground)]/60">Filter Crop:</span>
        {["all", "Tomato", "Onion", "Chilli"].map((crop) => (
          <Button
            key={crop}
            variant={cropFilter === crop ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs capitalize"
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
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <Card glass className="h-full flex flex-col justify-between">
              <div>
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
                    <span className="font-semibold tabular-nums">
                      {l.qty.toLocaleString("en-IN")} {t("common_unit_kg")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--foreground)]/60">{t("market_floor")}</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-300">
                      {tReplace("market_floor_per_kg", { n: l.min })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder={t("market_bid_ph")}
                      value={bid[l.id] ?? ""}
                      onChange={(e) => setBid({ ...bid, [l.id]: e.target.value })}
                    />
                    <Button
                      className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"
                      disabled={submittingId === l.id}
                      onClick={() => void submitBid(l)}
                    >
                      <Gavel className="h-4 w-4" />
                      {t("market_bid")}
                    </Button>
                  </div>
                  <p className="text-xs text-[var(--foreground)]/50">
                    {tReplace("market_listing_bids", { count: l.bids })}
                  </p>
                </CardContent>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
