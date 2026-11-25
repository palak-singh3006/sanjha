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
  Sun,
  Moon,
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
  { href: "/profile", key: "nav_profile", icon: User },
  { href: "/buyer", key: "nav_buyer", icon: ShoppingBag },
];

function useOnlineSync(): SyncStatus {
  const [status, setStatus] = useState<SyncStatus>(() =>
    typeof window !== "undefined" && !navigator.onLine
      ? "offline"
      : "synced"
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

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const sync = useOnlineSync();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-[var(--leaf)]/20">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 md:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setOpen((o) => !o)}
              aria-label={t("shell_aria_menu")}
            >
              <Menu />
            </Button>

            <Link href="/" className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--forest)] text-xs font-bold text-[var(--primary-foreground)] shadow-xs">
                S
              </span>

              <div className="leading-tight">
                <p className="text-sm font-semibold tracking-wide">
                  {t("brand_name")}
                </p>

                <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                  {t("tagline")}
                </p>
              </div>
            </Link>
          </div>

          <div className="hidden flex-1 items-center justify-center gap-1 md:flex">
            {nav.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link key={item.href} href={item.href}>
                  <span
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                      active
                        ? "bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)] shadow-xs"
                        : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {t(item.key)}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={sync === "offline" ? "outline" : "secondary"} className="text-[11px] font-normal">
              {sync === "offline"
                ? t("sync_offline")
                : t("sync_synced")}
            </Badge>

            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
              className="h-8 rounded-lg border border-[var(--border)] bg-[var(--card)] px-2 text-xs text-[var(--foreground)] outline-none cursor-pointer hover:border-[var(--border-strong)] transition-colors"
              aria-label={t("shell_aria_language")}
            >
              {locales.map((l) => (
                <option
                  key={l}
                  value={l}
                  className="bg-[var(--background)] text-[var(--foreground)]"
                >
                  {localeLabels[l]}
                </option>
              ))}
            </select>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              onClick={() =>
                setTheme(theme === "dark" ? "light" : "dark")
              }
              aria-label={t("shell_aria_theme")}
            >
              {!mounted ? null : theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            <Link href="/login">
              <Button
                variant="secondary"
                size="sm"
                className="hidden sm:inline-flex h-8 text-xs font-medium"
              >
                {t("nav_login")}
              </Button>
            </Link>
          </div>
        </div>

        {open && (
          <div className="border-t border-[var(--border)] bg-[var(--background)] px-4 py-3 md:hidden">
            <nav className="flex flex-col gap-1">
              {nav.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50"
                  >
                    <Icon className="h-4 w-4" />
                    {t(item.key)}
                  </Link>
                );
              })}

              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="px-3 py-2 text-sm text-[var(--forest)] font-medium"
              >
                {t("nav_login")}
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 md:px-6">
        {children}
      </main>
    </div>
  );
}