"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/provider";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@sanjha.network");
  const [password, setPassword] = useState("password");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { t } = useI18n();

  async function continueWithDemo() {
    localStorage.setItem(
      "sanjha-demo-auth",
      JSON.stringify({ email, mode: "demo", at: Date.now() }),
    );
    setMsg(t("login_ok_demo"));
    router.push("/dashboard");
  }

  async function onContinue() {
    setBusy(true);
    try {
      const supabase = createClient();
      if (!supabase) {
        await continueWithDemo();
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMsg(`${t("login_err_prefix")} ${error.message}`);
        return;
      }
      setMsg(t("login_ok_session"));
      router.push("/dashboard");
    } catch {
      // Network/supabase failures fall back to demo login so app remains usable offline.
      await continueWithDemo();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t("login_title")}</h1>
        <p className="mt-2 text-[var(--foreground)]/65">{t("login_sub")}</p>
      </div>
      <Card glass>
        <CardHeader>
          <CardTitle>{t("login_welcome")}</CardTitle>
          <CardDescription>{t("login_welcome_desc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="email"
            autoComplete="email"
            placeholder={t("login_email_ph")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            autoComplete="current-password"
            placeholder={t("login_password_ph")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button className="w-full" onClick={onContinue} disabled={busy}>
            {busy ? t("login_processing") : t("login_continue")}
          </Button>
          <Button type="button" variant="secondary" className="w-full" onClick={continueWithDemo}>
            {t("login_continue_demo")}
          </Button>
          {msg && <p className="text-sm text-[var(--foreground)]/70">{msg}</p>}
          <Link href="/dashboard" className="block text-center text-sm text-emerald-600 dark:text-emerald-300">
            {t("login_skip")}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
