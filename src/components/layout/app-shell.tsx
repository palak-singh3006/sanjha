"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Sparkles,
  Sprout,
  Leaf,
  Map,
  User,
  ShoppingBag,
  Menu,
  X,
  Sun,
  Moon,
  Radio,
  CheckCircle2,
  WifiOff,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/provider";
import { localeLabels, locales, type Locale } from "@/lib/i18n/dictionaries";
import type { SyncStatus } from "@/lib/offline/db";

const nav = [
  { href: "/dashboard", key: "nav_dashboard", icon: LayoutDashboard },
  { href: "/crop-intelligence", key: "nav_crop_intel", icon: Sprout },
  { href: "/marketplace", key: "nav_market", icon: Store },
  { href: "/copilot", key: "nav_copilot", icon: Sparkles },
  { href: "/soil", key: "nav_soil", icon: Leaf },
  { href: "/map", key: "nav_map", icon: Map },
  { href: "/buyer", key: "nav_buyer", icon: ShoppingBag },
  { href: "/profile", key: "nav_profile", icon: User },
];

function useOnlineSync(): SyncStatus {
  const [status, setStatus] = useState<SyncStatus>(() =>
    typeof window !== "undefined" && !navigator.onLine ? "offline" : "synced"
  );

  useEffect(() => {
    const online = () => setStatus("synced");
    const offline = () => setStatus("offline");

    window.addEventListener("online", online);
    window.addEventListener("offline", offline);

    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, []);

  return status;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t, locale, setLocale } = useI18n();
  const { theme, setTheme } = useTheme();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const sync = useOnlineSync();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine current section title
  const currentNav = nav.find((item) => pathname.startsWith(item.href)) || nav[0];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased">
      {/* Desktop Sidebar (Fixed left, solid restrained agritech surface) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-[var(--border)] bg-[var(--card)] md:flex">
        {/* Brand Header */}
        <div className="flex h-16 items-center gap-3 border-b border-[var(--border)] px-5">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-[var(--forest)] text-sm font-bold text-[var(--primary-foreground)] transition-transform group-hover:scale-105">
              S
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-wider text-[var(--foreground)]">
                {t("brand_name")}
              </p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                {t("tagline")}
              </p>
            </div>
          </Link>
        </div>

        {/* Operational Context Sub-banner */}
        <div className="border-b border-[var(--border)] bg-[var(--muted)]/50 px-5 py-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-[var(--foreground)] flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--forest)]" />
              Yadgir Cluster
            </span>
            <span className="text-[11px] font-mono text-[var(--muted-foreground)]">
              KA-YDG
            </span>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {nav.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link key={item.href} href={item.href}>
                <span
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-all duration-150",
                    active
                      ? "bg-[var(--muted)] text-[var(--forest)] font-semibold border-l-2 border-[var(--forest)] shadow-xs"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]/40 hover:text-[var(--foreground)]"
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", active ? "text-[var(--forest)]" : "text-[var(--muted-foreground)]")} />
                  <span>{t(item.key)}</span>
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer: Connectivity, Status & User */}
        <div className="border-t border-[var(--border)] p-4 space-y-3">
          <div className="flex items-center justify-between rounded-md bg-[var(--muted)]/50 p-2 text-xs">
            <div className="flex items-center gap-2">
              {sync === "offline" ? (
                <WifiOff className="h-3.5 w-3.5 text-amber-600" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 text-[var(--forest)]" />
              )}
              <span className="text-[11px] font-medium text-[var(--muted-foreground)]">
                {sync === "offline" ? t("sync_offline") : t("sync_synced")}
              </span>
            </div>
            <span className="text-[10px] font-mono text-[var(--muted-foreground)] uppercase">
              PWA Online
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <Link
              href="/profile"
              className="flex items-center gap-2 text-xs font-medium text-[var(--foreground)] hover:text-[var(--forest)] transition-colors"
            >
              <div className="h-7 w-7 rounded-full bg-[var(--forest)] text-[var(--primary-foreground)] flex items-center justify-center font-bold text-xs">
                SG
              </div>
              <div className="leading-tight">
                <p className="font-semibold text-xs">Sharanappa G.</p>
                <p className="text-[10px] text-[var(--muted-foreground)]">Hunasagi Farm</p>
              </div>
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                {t("nav_login")}
              </Button>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area (Offset by sidebar width on desktop) */}
      <div className="flex flex-col md:pl-64 min-h-screen">
        {/* Top Control Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--border)] bg-[var(--card)]/90 px-4 md:px-8 backdrop-blur-md">
          {/* Mobile Menu & Section Title */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9 text-[var(--foreground)]"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={t("shell_aria_menu")}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            <div className="hidden sm:flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
              <span>SANJHA Agritech</span>
              <span>/</span>
              <span className="font-semibold text-[var(--foreground)]">{t(currentNav.key)}</span>
            </div>

            <div className="sm:hidden font-semibold text-sm">
              {t(currentNav.key)}
            </div>
          </div>

          {/* Right Utilities: Language, Theme, Status */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--muted)]/40 px-2.5 py-1 text-xs">
              <Radio className="h-3 w-3 text-[var(--forest)] animate-pulse" />
              <span className="text-[11px] font-medium text-[var(--foreground)] hidden sm:inline">
                Telemetry Active
              </span>
            </div>

            {/* Language Switcher */}
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
              className="h-8 rounded-md border border-[var(--border)] bg-[var(--card)] px-2.5 text-xs font-medium text-[var(--foreground)] outline-none cursor-pointer hover:border-[var(--border-strong)] transition-colors"
              aria-label={t("shell_aria_language")}
            >
              {locales.map((l) => (
                <option key={l} value={l} className="bg-[var(--card)] text-[var(--foreground)]">
                  {localeLabels[l]}
                </option>
              ))}
            </select>

            {/* Dark / Light Toggle */}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-md border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label={t("shell_aria_theme")}
            >
              {!mounted ? null : theme === "dark" ? (
                <Sun className="h-3.5 w-3.5" />
              ) : (
                <Moon className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="border-b border-[var(--border)] bg-[var(--card)] px-4 py-4 md:hidden animate-in slide-in-from-top-2 duration-150">
            <nav className="flex flex-col gap-1">
              {nav.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-[var(--muted)] text-[var(--forest)] font-semibold border-l-2 border-[var(--forest)]"
                        : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {t(item.key)}
                  </Link>
                );
              })}
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="mt-2 px-3 py-2 text-sm text-[var(--forest)] font-medium border-t border-[var(--border)] pt-3"
              >
                {t("nav_login")}
              </Link>
            </nav>
          </div>
        )}

        {/* Main Content Workspace */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}