"use client";

import { Badge } from "@/components/ui/badge";
import { VoiceCopilotPanel } from "@/components/copilot/voice-copilot-panel";
import { useI18n } from "@/lib/i18n/provider";
import { Mic } from "lucide-react";

export default function CopilotPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <div className="border-b border-[var(--border)] pb-5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-widest text-[var(--muted-foreground)]">
            SANJHA Conversational Interface
          </span>
          <span className="text-[var(--border-strong)]">·</span>
          <Badge variant="forest" className="text-[10px] py-0 px-2">Voice & Text</Badge>
        </div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl text-[var(--foreground)]">
          {t("copilot_title")}
        </h1>
        <p className="mt-1 text-xs text-[var(--muted-foreground)] max-w-2xl">
          Voice-first agronomic copilot supporting Kannada, Hindi, Telugu, Tamil, Marathi, and Punjabi with offline advisory caching.
        </p>
      </div>

      <VoiceCopilotPanel />
    </div>
  );
}
