"use client";

import { VoiceCopilotPanel } from "@/components/copilot/voice-copilot-panel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/provider";

export default function CopilotPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{t("copilot_title")}</h1>
        <p className="mt-2 max-w-3xl text-[var(--foreground)]/65">{t("copilot_sub")}</p>
      </div>
      <VoiceCopilotPanel />
      <Card glass>
        <CardHeader>
          <CardTitle>{t("copilot_faq_title")}</CardTitle>
          <CardDescription>{t("copilot_faq_desc")}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-[var(--foreground)]/70">{t("copilot_faq_body")}</CardContent>
      </Card>
    </div>
  );
}
