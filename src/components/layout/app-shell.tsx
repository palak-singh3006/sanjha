"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Sparkles,
  MessagesSquare,
  Leaf,
  Map,
  User,
  ShoppingBag,
  BarChart3,
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
  { href: "/marketplace", key: "nav_market", icon: Store },
  { href: "/copilot", key: "nav_copilot", icon: Sparkles },
  { href: "/community", key: "nav_community", icon: MessagesSquare },
  { href: "/soil", key: "nav_soil", icon: Leaf },
  { href: "/map", key: "nav_map", icon: Map },
  { href: "/profile", key: "nav_profile", icon: User },
  { href: "/buyer", key: "nav_buyer", icon: ShoppingBag },
  { href: "/admin", key: "nav_admin", icon: BarChart3 },
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
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl dark:bg-emerald-500/15" />
        <div className="absolute right-0 top-40 h-[28rem] w-[28rem] rounded-full bg-amber-400/20 blur-3xl dark:bg-amber-400/10" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-teal-500/15 blur-3xl dark:bg-teal-500/10" />
      </div>

      <header className="sticky top-0 z-50 border-b border-[var(--foreground)]/10 bg-[var(--background)]/80 backdrop-blur-xl dark:bg-[var(--background)]/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
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

            <Link href="/" className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-sm font-bold text-[var(--forest)] shadow-lg shadow-emerald-900/30">
                S
              </span>

              <div className="leading-tight">
                <p className="text-sm font-semibold tracking-wide">
                  {t("brand_name")}
                </p>

                <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--foreground)]/50">
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
                      "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-[var(--foreground)]/10 text-[var(--foreground)]"
                        : "text-[var(--foreground)]/55 hover:bg-[var(--foreground)]/5 hover:text-[var(--foreground)]"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {t(item.key)}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={sync === "offline" ? "outline" : "secondary"}>
              {sync === "offline"
                ? t("sync_offline")
                : t("sync_synced")}
            </Badge>

            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
              className="h-9 rounded-lg border border-[var(--foreground)]/15 bg-[var(--foreground)]/5 px-2 text-xs text-[var(--foreground)] outline-none backdrop-blur-md"
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
                className="hidden sm:inline-flex"
              >
                {t("nav_login")}
              </Button>
            </Link>
          </div>
        </div>

        {open && (
          <div className="border-t border-[var(--foreground)]/10 bg-[var(--background)]/95 px-4 py-3 md:hidden">
            <nav className="flex flex-col gap-1">
              {nav.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--foreground)]/80"
                  >
                    <Icon className="h-4 w-4" />
                    {t(item.key)}
                  </Link>
                );
              })}

              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="px-3 py-2 text-sm"
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