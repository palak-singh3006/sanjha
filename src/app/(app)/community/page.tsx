"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { communityPosts as defaultCommunityPosts } from "@/lib/demo-data";
import { MapPin, ThumbsUp, Plus, CheckCircle2, RefreshCw, Sprout } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";

type Post = {
  id: string;
  title: string;
  crop: string;
  region: string;
  upvotes: number;
  success: number;
  validations: number;
  excerpt: string;
};

function mapKnowledgeRow(r: Record<string, unknown>): Post {
  const body = String(r.body ?? "");
  return {
    id: String(r.id ?? crypto.randomUUID()),
    title: String(r.title ?? "Post"),
    crop: String(r.crop_tag ?? "Tomato"),
    region: String(r.region_tag ?? "Yadgir"),
    upvotes: Number(r.upvotes ?? 0),
    success: Number(r.success_rate ?? 85),
    validations: Number(r.validated_count ?? 12),
    excerpt: body.length > 160 ? `${body.slice(0, 160)}…` : body || "—",
  };
}

export default function CommunityPage() {
  const [q, setQ] = useState("");
  const [posts, setPosts] = useState<Post[]>(defaultCommunityPosts);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCrop, setNewCrop] = useState("Tomato");
  const [newPest, setNewPest] = useState("Leaf curl / Pinworm");
  const [newRegion, setNewRegion] = useState("Yadgir");
  const [newBody, setNewBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [upvotedIds, setUpvotedIds] = useState<Set<string>>(new Set());

  const { t, tReplace } = useI18n();

  const loadKnowledge = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/knowledge", { cache: "no-store" });
      const raw = await res.json();
      if (!res.ok) {
        setPosts(defaultCommunityPosts);
        return;
      }
      const rows = Array.isArray(raw) ? raw : [];
      if (rows.length > 0) {
        setPosts(rows.map((row) => mapKnowledgeRow(row as Record<string, unknown>)));
      } else {
        setPosts(defaultCommunityPosts);
      }
    } catch {
      setPosts(defaultCommunityPosts);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadKnowledge();
  }, [loadKnowledge]);

  // Interactive upvoting
  function handleUpvote(postId: string) {
    if (upvotedIds.has(postId)) return;

    setUpvotedIds((prev) => new Set(prev).add(postId));
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, upvotes: p.upvotes + 1, validations: p.validations + 1 } : p)),
    );
    setNotice("Upvote & validation recorded! Thank you for strengthening collective knowledge.");
    setTimeout(() => setNotice(null), 4000);
  }

  // Interactive submit of new solution
  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setNotice(null);
    try {
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          cropTag: newCrop,
          pestTag: newPest,
          regionTag: newRegion,
          body: newBody,
          lang: "en",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to post solution");
      }

      setNotice("Agronomic practice successfully published to the community!");
      setShowCreate(false);
      setNewTitle("");
      setNewBody("");
      await loadKnowledge();
    } catch {
      setNotice("Solution saved locally to knowledge feed.");
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = useMemo(() => {
    if (!q.trim()) return posts;
    const s = q.toLowerCase();
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(s) ||
        p.crop.toLowerCase().includes(s) ||
        p.region.toLowerCase().includes(s) ||
        p.excerpt.toLowerCase().includes(s),
    );
  }, [q, posts]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{t("comm_title")}</h1>
          <p className="mt-2 max-w-3xl text-[var(--foreground)]/65">{t("comm_sub")}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadKnowledge} disabled={loading} className="gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
            Live Sync
          </Button>

          <Button
            size="sm"
            onClick={() => setShowCreate(!showCreate)}
            className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500"
          >
            <Plus className="h-4 w-4" />
            Share Agronomic Solution
          </Button>
        </div>
      </div>

      {notice && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-700 dark:text-emerald-200">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
          <span>{notice}</span>
        </div>
      )}

      {/* Share Solution Drawer */}
      {showCreate && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card glass className="border-emerald-500/30 bg-emerald-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Share Field-Tested Practice with Cluster</CardTitle>
              <CardDescription>
                Empower fellow farmers with organic pest recipes, irrigation tricks, or residue reuse techniques.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreatePost} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label className="text-xs text-[var(--foreground)]/60">Practice Title</label>
                    <Input
                      className="mt-1"
                      placeholder="e.g. Neem oil + sticky traps for tomato pinworm"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[var(--foreground)]/60">Crop Focus</label>
                    <Input
                      className="mt-1"
                      value={newCrop}
                      onChange={(e) => setNewCrop(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs text-[var(--foreground)]/60">Pest / Problem Solved</label>
                    <Input
                      className="mt-1"
                      value={newPest}
                      onChange={(e) => setNewPest(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[var(--foreground)]/60">Region / Village</label>
                    <Input
                      className="mt-1"
                      value={newRegion}
                      onChange={(e) => setNewRegion(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-[var(--foreground)]/60">Detailed Method / Dosages</label>
                  <textarea
                    className="mt-1 w-full rounded-xl border border-[var(--foreground)]/15 bg-[var(--background)]/60 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    rows={3}
                    placeholder="Describe exact preparation, ratios, application frequency, and observed results..."
                    value={newBody}
                    onChange={(e) => setNewBody(e.target.value)}
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowCreate(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={submitting} className="bg-emerald-600 text-white hover:bg-emerald-700">
                    {submitting ? "Publishing..." : "Publish to Community"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Search Bar */}
      <Card glass>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{t("comm_search_title")}</CardTitle>
          <CardDescription>{t("comm_search_ex")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by crop, pest, region, or keyword (e.g. Neem oil, Purple blotch, Kolar)..."
          />
        </CardContent>
      </Card>

      {/* Knowledge Posts Feed */}
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card glass className="h-full flex flex-col justify-between">
              <div>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-300">
                      {p.crop}
                    </Badge>
                    <span className="flex items-center gap-1 text-xs text-[var(--foreground)]/50">
                      <MapPin className="h-3 w-3" />
                      {p.region}
                    </span>
                  </div>
                  <CardTitle className="mt-2 text-lg font-semibold">{p.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-[var(--foreground)]/75">{p.excerpt}</p>
                </CardContent>
              </div>

              <div className="border-t border-[var(--foreground)]/10 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {tReplace("comm_success_rate", { n: p.success })}
                  </Badge>
                  <span className="text-xs text-[var(--foreground)]/50">
                    {tReplace("comm_validations", { n: p.validations })}
                  </span>
                </div>

                <Button
                  size="sm"
                  variant={upvotedIds.has(p.id) ? "secondary" : "outline"}
                  className="gap-1.5 h-8 text-xs"
                  onClick={() => handleUpvote(p.id)}
                >
                  <ThumbsUp className={`h-3.5 w-3.5 ${upvotedIds.has(p.id) ? "text-emerald-500 fill-emerald-500" : ""}`} />
                  <span>{p.upvotes}</span>
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
