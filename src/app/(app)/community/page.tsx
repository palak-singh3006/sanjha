"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { communityPosts } from "@/lib/demo-data";
import { MapPin, ThumbsUp, Mic2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";

export default function CommunityPage() {
  const [q, setQ] = useState("Tomato leaf curl in Kolar");
  const { t, tReplace } = useI18n();

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return communityPosts.filter(
      (p) =>
        p.title.toLowerCase().includes(s) ||
        p.crop.toLowerCase().includes(s) ||
        p.region.toLowerCase().includes(s),
    );
  }, [q]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{t("comm_title")}</h1>
        <p className="mt-2 max-w-3xl text-[var(--foreground)]/65">{t("comm_sub")}</p>
      </div>

      <Card glass>
        <CardHeader>
          <CardTitle>{t("comm_search_title")}</CardTitle>
          <CardDescription>{t("comm_search_ex")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("comm_search_ph")} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Card glass className="h-full">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{p.crop}</Badge>
                  <Badge variant="outline" className="gap-1">
                    <MapPin className="h-3 w-3" />
                    {p.region}
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    <Mic2 className="h-3 w-3" />
                    {t("comm_voice_notes_badge")}
                  </Badge>
                </div>
                <CardTitle className="mt-2 text-lg">{p.title}</CardTitle>
                <CardDescription>{p.excerpt}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3 text-sm text-[var(--foreground)]/70">
                <span className="inline-flex items-center gap-1">
                  <ThumbsUp className="h-4 w-4" />
                  {tReplace("comm_upvotes_count", { count: p.upvotes })}
                </span>
                <span>{tReplace("comm_success_pct", { pct: p.success })}</span>
                <span>{tReplace("comm_validated_farmers", { count: p.validations })}</span>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
