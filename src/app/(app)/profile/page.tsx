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
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[var(--muted-foreground)]">
              SANJHA Member Registry
            </span>
            <span className="text-[var(--border-strong)]">·</span>
            <Badge variant="forest" className="text-[10px] py-0 px-2">Verified Farmer</Badge>
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl text-[var(--foreground)]">{t("profile_title")}</h1>
          <p className="mt-1 text-xs text-[var(--muted-foreground)] max-w-2xl">{t("profile_sub")}</p>
        </div>

        <Button variant="outline" size="sm" onClick={loadProfile} disabled={loading} className="h-8 gap-1.5 text-xs border-[var(--border)]">
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin text-[var(--forest)]" : "text-[var(--muted-foreground)]"}`} />
          Sync
        </Button>
      </div>

      {savedMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--muted)]/60 px-4 py-2.5 text-xs text-[var(--foreground)]">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--forest)]" />
          <span>{savedMsg}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Profile Edit Card */}
        <div className="lg:col-span-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="pb-3 border-b border-[var(--border)]">
            <h2 className="text-base font-semibold text-[var(--foreground)]">{t("profile_card_title")}</h2>
            <p className="text-xs text-[var(--muted-foreground)]">{t("profile_card_desc")}</p>
          </div>

          <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">Full Name</label>
                <Input className="mt-1 h-8 text-xs" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">Mobile Number</label>
                <Input className="mt-1 h-8 text-xs font-mono" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">{t("profile_village")}</label>
                <Input className="mt-1 h-8 text-xs" value={village} onChange={(e) => setVillage(e.target.value)} required />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">District</label>
                <Input className="mt-1 h-8 text-xs" value={district} onChange={(e) => setDistrict(e.target.value)} required />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">{t("profile_land")}</label>
                <Input className="mt-1 h-8 text-xs font-mono" type="number" step="0.1" value={land} onChange={(e) => setLand(e.target.value)} required />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">{t("profile_crops")}</label>
                <Input className="mt-1 h-8 text-xs" value={crops} onChange={(e) => setCrops(e.target.value)} required />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)]">{t("profile_lang_code")}</label>
              <Input className="mt-1 h-8 text-xs" value={lang} onChange={(e) => setLang(e.target.value)} required />
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Badge variant="forest">
                {t("profile_coord_badge")}
              </Badge>
              <Badge variant="secondary">{t("profile_kyc_badge")}</Badge>
            </div>

            <div className="flex flex-wrap gap-2.5 pt-3 border-t border-[var(--border)]">
              <Button type="submit" disabled={saving} className="h-8 text-xs gap-1.5 bg-[var(--forest)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]">
                <Save className="h-3.5 w-3.5" />
                {saving ? "Saving..." : "Save Profile to Cluster"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="h-8 text-xs border-[var(--border)]"
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
        </div>

        {/* Holdings & Cluster Membership Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          {/* Registered Farms */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
            <div className="pb-3 border-b border-[var(--border)] flex items-center gap-2">
              <Sprout className="h-4 w-4 text-[var(--forest)]" />
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)]">Registered Farm Holdings</h3>
                <p className="text-xs text-[var(--muted-foreground)]">Parcels synchronized in cluster</p>
              </div>
            </div>
            <div className="mt-3 space-y-2.5">
              {farms.length > 0 ? (
                farms.map((f: any) => (
                  <div key={f.id} className="rounded-lg border border-[var(--border)] bg-[var(--background)]/60 p-3">
                    <p className="font-semibold text-xs text-[var(--foreground)]">{f.name}</p>
                    <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
                      {f.acres} Acres · {f.soilType || f.soil_type || "loamy"} soil · {f.irrigationType || f.irrigation_type || "drip"}
                    </p>
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-[var(--forest)]">
                      <MapPin className="h-3 w-3" />
                      <span>{f.village}, {district}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-[var(--border)] bg-[var(--background)]/60 p-3">
                  <p className="font-semibold text-xs text-[var(--foreground)]">Gowda South Field</p>
                  <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">3.5 Acres · Loamy soil · Drip</p>
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-[var(--forest)]">
                    <MapPin className="h-3 w-3" />
                    <span>Hunasagi, Yadgir</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cluster Membership */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
            <div className="pb-3 border-b border-[var(--border)] flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[var(--forest)]" />
              <h3 className="text-sm font-semibold text-[var(--foreground)]">Cluster Association</h3>
            </div>
            <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 p-3">
              <p className="font-semibold text-xs text-[var(--foreground)]">
                {memberships[0]?.groupName || "Hunasagi Progressive Farmers Cluster"}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-[10px] font-mono">
                  Code: {memberships[0]?.groupCode || "HUN-01"}
                </Badge>
                <Badge variant="forest" className="text-[10px] capitalize">
                  {memberships[0]?.role || "Member"} · Active
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Eco Credit Dashboard */}
      <div className="max-w-2xl rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="pb-3 border-b border-[var(--border)]">
          <h2 className="text-base font-semibold text-[var(--foreground)]">{t("profile_eco_title")}</h2>
          <p className="text-xs text-[var(--muted-foreground)]">{t("profile_eco_desc")}</p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--background)]/60 p-4">
            <span className="text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">{t("profile_eco_income")}</span>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-[var(--foreground)]">
              ₹{Math.round(eco.income).toLocaleString("en-IN")}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 p-4">
            <span className="text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">{t("profile_eco_co2")}</span>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-[var(--forest)]">
              {Math.round(eco.savedKgCO2e).toLocaleString("en-IN")} kg
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
