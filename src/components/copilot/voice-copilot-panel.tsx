"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cacheAdvisory } from "@/lib/offline/db";
import { useI18n } from "@/lib/i18n/provider";

const speechLangs = [
  { code: "kn-IN", labelKey: "voice_lang_kn" as const },
  { code: "hi-IN", labelKey: "voice_lang_hi" as const },
  { code: "te-IN", labelKey: "voice_lang_te" as const },
  { code: "ta-IN", labelKey: "voice_lang_ta" as const },
  { code: "mr-IN", labelKey: "voice_lang_mr" as const },
  { code: "pa-IN", labelKey: "voice_lang_pa" as const },
];

export function VoiceCopilotPanel() {
  const { t } = useI18n();
  const [lang, setLang] = useState("kn-IN");
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const recogRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    type SRConstructor = new () => SpeechRecognition;
    const w = window as unknown as {
      SpeechRecognition?: SRConstructor;
      webkitSpeechRecognition?: SRConstructor;
    };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.continuous = false;
    r.interimResults = true;
    r.lang = lang;
    r.onresult = (e: SpeechRecognitionEvent) => {
      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
      }
      setTranscript(text);
    };
    r.onend = () => setListening(false);
    recogRef.current = r;
  }, [lang]);

  const speak = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      window.speechSynthesis.speak(u);
    },
    [lang],
  );

  const stopListening = useCallback(() => {
    recogRef.current?.stop();
    setListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (!recogRef.current) {
      setTranscript(t("voice_not_supported"));
      return;
    }
    recogRef.current.lang = lang;
    setTranscript("");
    setReply("");
    setListening(true);
    try {
      recogRef.current.start();
    } catch {
      setListening(false);
    }
  }, [lang, t]);

  const askAI = useCallback(async () => {
    const q = transcript.trim() || t("voice_default_question");
    setLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q, lang }),
      });
      const data = (await res.json()) as { reply: string };
      setReply(data.reply);
      await cacheAdvisory(`last:${lang}`, data.reply, lang);
      speak(data.reply);
    } catch {
      const offline = t("voice_offline_reply");
      setReply(offline);
      await cacheAdvisory(`last:${lang}`, offline, lang);
      speak(offline);
    } finally {
      setLoading(false);
    }
  }, [lang, speak, t, transcript]);

  return (
    <Card glass className="overflow-hidden border-emerald-500/20">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            {t("voice_title")}
            <Badge variant="gold">{t("voice_ws_badge")}</Badge>
          </CardTitle>
          <p className="mt-1 text-sm text-[var(--foreground)]/60">{t("voice_sub")}</p>
        </div>
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className="h-10 rounded-xl border border-[var(--foreground)]/15 bg-[var(--foreground)]/5 px-3 text-sm"
          aria-label={t("profile_lang_code")}
        >
          {speechLangs.map((l) => (
            <option key={l.code} value={l.code}>
              {t(l.labelKey)}
            </option>
          ))}
        </select>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <motion.button
            type="button"
            onClick={() => (listening ? stopListening() : startListening())}
            className="relative grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-[var(--forest)] shadow-[0_0_40px_rgba(52,211,153,0.45)]"
            whileTap={{ scale: 0.96 }}
            aria-label={listening ? t("voice_stop") : t("voice_start")}
          >
            <AnimatePresence>
              {listening && (
                <motion.span
                  className="absolute inset-0 rounded-full border-2 border-white/50"
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ scale: 1.35, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                />
              )}
            </AnimatePresence>
            {listening ? <Square className="h-7 w-7" /> : <Mic className="h-8 w-8" />}
          </motion.button>
          <div className="flex-1 space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--foreground)]/50">
              {t("voice_live_label")}
            </p>
            <div className="min-h-[52px] rounded-xl border border-[var(--foreground)]/10 bg-[var(--foreground)]/5 p-3 text-sm">
              {transcript || t("voice_try_hint")}
            </div>
            <div className="flex h-8 items-end gap-1">
              {[4, 7, 5, 9, 6, 8, 5].map((h, i) => (
                <motion.span
                  key={i}
                  className="w-1.5 rounded-full bg-emerald-400/80"
                  animate={{
                    height: listening ? h * 4 : 6,
                    opacity: listening ? 1 : 0.35,
                  }}
                  transition={{
                    repeat: listening ? Infinity : 0,
                    duration: 0.6,
                    delay: i * 0.05,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={askAI} disabled={loading}>
            {loading ? t("voice_thinking") : t("voice_ask")}
          </Button>
          <Button type="button" variant="secondary" onClick={() => reply && speak(reply)}>
            <Volume2 className="h-4 w-4" />
            {t("voice_replay")}
          </Button>
        </div>

        {reply && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-4 text-sm leading-relaxed"
          >
            {reply}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
