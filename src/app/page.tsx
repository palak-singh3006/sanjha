"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/provider";

export default function LandingPage() {
  const { t } = useI18n();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030806] text-white">
      <div className="pointer-events-none absolute inset-0 noise opacity-40" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-10 h-[520px] w-[520px] rounded-full bg-emerald-500/25 blur-3xl" />
        <div className="absolute right-[-120px] top-32 h-[480px] w-[480px] rounded-full bg-amber-300/15 blur-3xl" />
        <div className="absolute bottom-[-80px] left-1/4 h-[420px] w-[420px] rounded-full bg-teal-400/15 blur-3xl" />
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.12]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-4 py-6 md:px-8">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-sm font-bold text-[#052e1f] shadow-lg shadow-emerald-900/40">
            S
          </span>
          <div>
            <p className="text-sm font-semibold tracking-[0.25em]">{t("brand_name")}</p>
            <p className="text-[10px] uppercase tracking-[0.35em] text-white/45">{t("tagline")}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/copilot" className="hidden text-sm text-white/70 hover:text-white sm:inline">
            {t("landing_nav_copilot_link")}
          </Link>
          <Link href="/login">
            <Button variant="secondary" size="sm" className="border-white/15 bg-white/10 text-white">
              {t("nav_login")}
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="sm" className="shadow-emerald-500/30">
              {t("landing_open_app")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex max-w-7xl flex-col gap-16 px-4 pb-24 pt-6 md:px-8 md:pt-10">
        <section className="grid gap-12 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {t("landing_badge")}
            </motion.div>
            <motion.h1
              className="mt-6 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.65 }}
            >
              {t("landing_title_1")}
              <span className="block bg-gradient-to-r from-emerald-200 via-white to-amber-200 bg-clip-text text-transparent">
                {t("landing_title_2")}
              </span>
            </motion.h1>
            <motion.p
              className="mt-6 max-w-xl text-lg text-white/70"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6 }}
            >
              {t("hero_sub")}
            </motion.p>
            <motion.div
              className="mt-8 flex flex-wrap gap-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.55 }}
            >
              <Link href="/dashboard">
                <Button size="lg" className="shadow-[0_0_60px_rgba(52,211,153,0.35)]">
                  {t("cta_start")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/copilot">
                <Button size="lg" variant="outline" className="border-white/25 text-white hover:bg-white/10">
                  <Play className="h-4 w-4" />
                  {t("cta_demo")}
                </Button>
              </Link>
            </motion.div>
            <motion.p
              className="mt-6 max-w-lg text-sm text-white/55"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.5 }}
            >
              {t("landing_story_line")}{" "}
              <span className="text-white/85">{t("landing_story_bold")}</span>
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="relative"
          >
            <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-emerald-500/40 via-transparent to-amber-300/30 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-2xl">
              <div className="flex items-center justify-between text-xs text-white/55">
                <span>{t("landing_live_cluster")}</span>
                <Badge variant="gold" className="text-[10px]">
                  {t("landing_pwa_offline")}
                </Badge>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  { label: t("landing_feat_crop"), value: t("landing_feat_crop_v") },
                  { label: t("landing_feat_mkt"), value: t("landing_feat_mkt_v") },
                  { label: t("landing_feat_voice"), value: t("landing_feat_voice_v") },
                  { label: t("landing_feat_db"), value: t("landing_feat_db_v") },
                ].map((c, i) => (
                  <motion.div
                    key={c.label}
                    className="rounded-2xl border border-white/10 bg-black/30 p-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 + i * 0.06 }}
                  >
                    <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">{c.label}</p>
                    <p className="mt-2 text-lg font-semibold">{c.value}</p>
                  </motion.div>
                ))}
              </div>
              <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/15 to-transparent p-4 text-sm text-emerald-50/90">
                {t("landing_quote")}
              </div>
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
