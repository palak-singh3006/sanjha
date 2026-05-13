"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { type Locale, dictionaries, locales } from "./dictionaries";

const STORAGE_KEY = "sanjha-locale";

type I18nContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
  /** Replace `{name}` placeholders in the translated string. */
  tReplace: (key: string, vars: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") return "en";
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved && locales.includes(saved)) return saved;
    return "en";
  });

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = locale === "en" ? "en" : locale;
    const rtl = new Set<Locale>([]);
    document.documentElement.dir = rtl.has(locale) ? "rtl" : "ltr";
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const t = useCallback(
    (key: string) => {
      const dict = dictionaries[locale] ?? dictionaries.en;
      return dict[key] ?? dictionaries.en[key] ?? key;
    },
    [locale],
  );

  const tReplace = useCallback(
    (key: string, vars: Record<string, string | number>) => {
      let s = t(key);
      for (const [k, v] of Object.entries(vars)) {
        s = s.split(`{${k}}`).join(String(v));
      }
      return s;
    },
    [t],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, tReplace }),
    [locale, setLocale, t, tReplace],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
