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
    <div className="relative min-h-screen overflow-hidden bg-[#121B15] text-[#F4F2E9]">
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <svg
          className="absolute inset-0 h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-4 py-6 md:px-8 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--forest)] text-sm font-bold text-[var(--primary-foreground)]">
            S
          </span>
          <div>
            <p className="text-sm font-semibold tracking-[0.2em]">{t("brand_name")}</p>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#F4F2E9]/50">{t("tagline")}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/copilot" className="hidden text-sm text-[#F4F2E9]/70 hover:text-white sm:inline">
            {t("landing_nav_copilot_link")}
          </Link>
          <Link href="/login">
            <Button variant="secondary" size="sm" className="border-white/15 bg-white/10 text-white hover:bg-white/15">
              {t("nav_login")}
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="sm">
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
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--leaf)]/40 bg-[var(--leaf)]/10 px-3 py-1 text-xs text-[#E2DDD0]"
            >
              <Sparkles className="h-3.5 w-3.5 text-[var(--gold)]" />
              {t("landing_badge")}
            </motion.div>
            <motion.h1
              className="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl text-[#F4F2E9]"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.65 }}
            >
              {t("landing_title_1")}
              <span className="block text-[var(--leaf)]">
                {t("landing_title_2")}
              </span>
            </motion.h1>
            <motion.p
              className="mt-6 max-w-xl text-lg text-[#F4F2E9]/75"
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
                <Button size="lg">
                  {t("cta_start")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/copilot">
                <Button size="lg" variant="outline" className="border-white/20 text-[#F4F2E9] hover:bg-white/10">
                  <Play className="h-4 w-4" />
                  {t("cta_demo")}
                </Button>
              </Link>
            </motion.div>
            <motion.p
              className="mt-6 max-w-lg text-sm text-[#F4F2E9]/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.5 }}
            >
              {t("landing_story_line")}{" "}
              <span className="text-[#F4F2E9]/90">{t("landing_story_bold")}</span>
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-xl border border-white/15 bg-white/[0.04] p-6 shadow-sm">
              <div className="flex items-center justify-between text-xs text-[#F4F2E9]/60">
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
                    className="rounded-lg border border-white/10 bg-black/25 p-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 + i * 0.06 }}
                  >
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[#F4F2E9]/50">{c.label}</p>
                    <p className="mt-2 text-lg font-semibold text-[#F4F2E9]">{c.value}</p>
                  </motion.div>
                ))}
              </div>
              <div className="mt-6 rounded-lg border border-[var(--leaf)]/30 bg-[var(--leaf)]/10 p-4 text-sm text-[#F4F2E9]/90">
                {t("landing_quote")}
              </div>
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
