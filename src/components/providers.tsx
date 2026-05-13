"use client";

import { ThemeProvider } from "next-themes";
import { I18nProvider } from "@/lib/i18n/provider";
import { PwaRegister } from "@/components/pwa-register";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <I18nProvider>
        {children}
        <PwaRegister />
      </I18nProvider>
    </ThemeProvider>
  );
}
