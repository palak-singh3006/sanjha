"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { queueListingDraft, getHarvestLogs } from "@/lib/offline/db";
import { useI18n } from "@/lib/i18n/provider";
import { apiGetMe } from "@/lib/http/api";
import { CheckCircle2, Save, Sprout, MapPin, Building2, RefreshCw } from "lucide-react";

export default function ProfilePage() {
  const [userId, setUserId] = useState<string>("a1000000-0000-0000-0000-000000000001");
  const [fullName, setFullName] = useState("Sharanappa Gowda");
  const [phone, setPhone] = useState("+91 98450 12345");
  const [village, setVillage] = useState("Hunasagi");
  const [district, setDistrict] = useState("Yadgir");
  const [land, setLand] = useState("3.5");
  const [crops, setCrops] = useState("Tomato, Onion");
  const [lang, setLang] = useState("kn");
  const [farms, setFarms] = useState<any[]>([]);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const { t } = useI18n();
  const [eco, setEco] = useState<{ income: number; savedKgCO2e: number }>({ income: 0, savedKgCO2e: 0 });

  // Load live user profile from /api/auth/me
  async function loadProfile() {
    setLoading(true);
    try {
      const res = await apiGetMe();
      const data = res.data || res;
      if (data?.user) {
        setUserId(data.user.id);
        setFullName(data.user.fullName || data.user.full_name || "Sharanappa Gowda");
        setPhone(data.user.phone || "+91 98450 12345");
        setVillage(data.user.village || "Hunasagi");
        setDistrict(data.user.district || "Yadgir");
        setLang(data.user.preferredLanguage || data.user.preferred_language || "kn");
      }
      if (data?.farmerProfile) {
        setLand(String(data.farmerProfile.totalLandAcres || data.farmerProfile.total_land_acres || "3.5"));
        if (Array.isArray(data.farmerProfile.primaryCrops)) {
          setCrops(data.farmerProfile.primaryCrops.join(", "));
        }
      }
      if (Array.isArray(data?.farms)) {
        setFarms(data.farms);
      }
      if (Array.isArray(data?.memberships)) {
        setMemberships(data.memberships);
      }
    } catch (err) {
      console.warn("Using offline demo profile data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProfile();
    (async () => {
      const logs = await getHarvestLogs();
      const income = logs.reduce((sum, h) => sum + (h.potentialIncomeINR ?? 0), 0);
      const savedKgCO2e = logs.reduce((sum, h) => sum + (h.ecoCreditSavedKgCO2e ?? 0), 0);
      setEco({ income, savedKgCO2e });
    })();
  }, []);

  // Save profile updates to backend /api/farmers/[id]
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSavedMsg(null);
    try {
      const primaryCropsArray = crops.split(",").map((c) => c.trim()).filter(Boolean);
      const res = await fetch(`/api/farmers/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phone,
          village,
          district,
          totalLandAcres: Number(land),
          primaryCrops: primaryCropsArray,
          preferredLanguage: lang,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Update failed");
      }

      setSavedMsg("Farmer profile successfully updated in SANJHA cluster registry!");
      setTimeout(() => setSavedMsg(null), 5000);
    } catch (err: any) {
      setSavedMsg(`Profile updated locally: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{t("profile_title")}</h1>
          <p className="mt-2 max-w-3xl text-[var(--foreground)]/65">{t("profile_sub")}</p>
        </div>

        <Button variant="outline" size="sm" onClick={loadProfile} disabled={loading} className="gap-1.5">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
          Live Sync
        </Button>
      </div>

      {savedMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-700 dark:text-emerald-200">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
          <span>{savedMsg}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Edit Card */}
        <Card glass className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("profile_card_title")}</CardTitle>
            <CardDescription>{t("profile_card_desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="text-[var(--foreground)]/60">Full Name</span>
                  <Input className="mt-1" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </label>
                <label className="block text-sm">
                  <span className="text-[var(--foreground)]/60">Mobile Number</span>
                  <Input className="mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="text-[var(--foreground)]/60">{t("profile_village")}</span>
                  <Input className="mt-1" value={village} onChange={(e) => setVillage(e.target.value)} required />
                </label>
                <label className="block text-sm">
                  <span className="text-[var(--foreground)]/60">District</span>
                  <Input className="mt-1" value={district} onChange={(e) => setDistrict(e.target.value)} required />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="text-[var(--foreground)]/60">{t("profile_land")}</span>
                  <Input className="mt-1" type="number" step="0.1" value={land} onChange={(e) => setLand(e.target.value)} required />
                </label>
                <label className="block text-sm">
                  <span className="text-[var(--foreground)]/60">{t("profile_crops")}</span>
                  <Input className="mt-1" value={crops} onChange={(e) => setCrops(e.target.value)} required />
                </label>
              </div>

              <label className="block text-sm">
                <span className="text-[var(--foreground)]/60">{t("profile_lang_code")}</span>
                <Input className="mt-1" value={lang} onChange={(e) => setLang(e.target.value)} required />
              </label>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge className="bg-emerald-600/20 text-emerald-300 border-emerald-500/30">
                  {t("profile_coord_badge")}
                </Badge>
                <Badge variant="secondary">{t("profile_kyc_badge")}</Badge>
              </div>

              <div className="flex flex-wrap gap-3 pt-3">
                <Button type="submit" disabled={saving} className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700">
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save Profile to Cluster"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    await queueListingDraft({
                      id: crypto.randomUUID(),
                      crop: crops.split(",")[0]?.trim() || "Mixed",
                      qtyKg: 500,
                      minPrice: 36,
                      status: "queued",
                      createdAt: Date.now(),
                    });
                    setSavedMsg("Produce lot queued to offline IndexedDB storage.");
                  }}
                >
                  {t("profile_queue_btn")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Holdings & Cluster Membership Sidebar */}
        <div className="space-y-6">
          {/* Registered Farms */}
          <Card glass>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sprout className="h-4 w-4 text-emerald-500" />
                Registered Farm Holdings
              </CardTitle>
              <CardDescription>Parcels synchronized in cluster</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {farms.length > 0 ? (
                farms.map((f: any) => (
                  <div key={f.id} className="rounded-xl border border-[var(--foreground)]/10 bg-[var(--foreground)]/5 p-3">
                    <p className="font-semibold text-sm">{f.name}</p>
                    <p className="text-xs text-[var(--foreground)]/60 mt-0.5">
                      {f.acres} Acres · {f.soilType || f.soil_type || "loamy"} soil · {f.irrigationType || f.irrigation_type || "drip"}
                    </p>
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-500">
                      <MapPin className="h-3 w-3" />
                      <span>{f.village}, {district}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-[var(--foreground)]/10 bg-[var(--foreground)]/5 p-3">
                  <p className="font-semibold text-sm">Gowda South Field</p>
                  <p className="text-xs text-[var(--foreground)]/60 mt-0.5">3.5 Acres · Loamy soil · Drip</p>
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-500">
                    <MapPin className="h-3 w-3" />
                    <span>Hunasagi, Yadgir</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cluster Membership */}
          <Card glass>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-500" />
                Cluster Association
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                <p className="font-semibold text-sm">
                  {memberships[0]?.groupName || "Hunasagi Progressive Farmers Cluster"}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant="outline" className="text-[11px] border-emerald-500/40 text-emerald-400">
                    Code: {memberships[0]?.groupCode || "HUN-01"}
                  </Badge>
                  <Badge variant="secondary" className="text-[11px] capitalize">
                    {memberships[0]?.role || "Member"} · Active
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Eco Credit Dashboard */}
      <Card glass className="max-w-2xl">
        <CardHeader>
          <CardTitle>{t("profile_eco_title")}</CardTitle>
          <CardDescription>{t("profile_eco_desc")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-[var(--foreground)]/10 bg-[var(--foreground)]/5 p-4">
            <p className="text-xs uppercase tracking-wider text-[var(--foreground)]/50">{t("profile_eco_income")}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">
              ₹{Math.round(eco.income).toLocaleString("en-IN")}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <p className="text-xs uppercase tracking-wider text-[var(--foreground)]/50">{t("profile_eco_co2")}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">
              {Math.round(eco.savedKgCO2e).toLocaleString("en-IN")} kg
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
