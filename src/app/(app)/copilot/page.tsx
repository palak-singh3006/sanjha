"use client";

import { VoiceCopilotPanel } from "@/components/copilot/voice-copilot-panel";
import { useI18n } from "@/lib/i18n/provider";

export default function CopilotPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{t("copilot_title")}</h1>
      </div>
      <VoiceCopilotPanel />
    </div>
  );
}
