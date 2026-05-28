"use client";

import { useEffect, useMemo, useState } from "react";
import {
  filterMemoriesForPanel,
  type MemoryLike as CleanupMemoryLike,
} from "@/lib/memoryCleanup";

// ---------------------------------------------------------------------------
// Memory Timeline v2
// ---------------------------------------------------------------------------
// Shows memories as a life timeline grouped by recency (Today / This Week /
// This Month / Earlier) instead of a flat list. Human-readable only — no
// importance, ids, or technical metadata. No AI calls, UI only.

type MemoryLikeForTimeline = {
  memory?: string;
  type?: string;
  category?: string;
  importance?: number;
  emotionalWeight?: number;
  emotional_weight?: number;
  repeatCount?: number;
  repeat_count?: number;
  relationship_impact?: number;
  emotionalIntensity?: number;
  emotionalLayer?: string;
  entityName?: string;
  createdAt?: string;
  created_at?: string;
  lastAccessed?: string;
  last_accessed?: string;
};

type Props = {
  memories: MemoryLikeForTimeline[];
  lastUserMessage?: string | null;
  loading?: boolean;
};

type Bucket = "Today" | "This Week" | "This Month" | "Earlier";

const BUCKET_ORDER: Bucket[] = ["Today", "This Week", "This Month", "Earlier"];

type TimelineCard = {
  id: string;
  text: string;
  relativeTime: string | null;
  bucket: Bucket;
  ts: number; // for sorting; 0 when undated
};

const HOUR = 1000 * 60 * 60;
const DAY = HOUR * 24;

// ---------------------------------------------------------------------------
// Time helpers
// ---------------------------------------------------------------------------

function parseTime(value?: string): number | null {
  if (!value) return null;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? null : t;
}

function bucketFor(ageMs: number | null): Bucket {
  if (ageMs === null) return "Earlier";
  if (ageMs < DAY) return "Today";
  if (ageMs < DAY * 7) return "This Week";
  if (ageMs < DAY * 30) return "This Month";
  return "Earlier";
}

function relativeTime(ts: number | null): string | null {
  if (ts === null) return null;
  const diff = Math.max(0, Date.now() - ts);

  if (diff < 1000 * 60) return "Just now";
  if (diff < HOUR) return `${Math.floor(diff / (1000 * 60))}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < DAY * 2) return "Yesterday";
  if (diff < DAY * 7) return `${Math.floor(diff / DAY)} days ago`;
  if (diff < DAY * 14) return "Last week";
  if (diff < DAY * 30) return `${Math.floor(diff / (DAY * 7))} weeks ago`;
  if (diff < DAY * 60) return "Last month";
  return `${Math.floor(diff / (DAY * 30))} months ago`;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div className="py-3">
      <div className="h-2.5 w-20 rounded-full bg-white/10 animate-pulse" />
      <div className="mt-2.5 h-3 w-3/4 rounded-full bg-white/[0.06] animate-pulse" />
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-violet-200/40">
      {title}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function MemoryTimeline({ memories, loading = false }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const cards = useMemo((): TimelineCard[] => {
    if (!mounted) return [];

    const cleaned = filterMemoriesForPanel(
      (memories ?? []) as CleanupMemoryLike[]
    );

    const seen = new Set<string>();
    const out: TimelineCard[] = [];

    for (const m of cleaned) {
      const text = (m.memory ?? "").trim();
      if (!text) continue;

      const key = text.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      const ts = parseTime(m.created_at ?? m.createdAt);
      const ageMs = ts === null ? null : Date.now() - ts;

      out.push({
        id: `${key}`,
        text,
        relativeTime: relativeTime(ts),
        bucket: bucketFor(ageMs),
        ts: ts ?? 0,
      });
    }

    // Newest first.
    out.sort((a, b) => b.ts - a.ts);
    return out;
  }, [mounted, memories]);

  const grouped = useMemo(() => {
    const map: Record<Bucket, TimelineCard[]> = {
      Today: [],
      "This Week": [],
      "This Month": [],
      Earlier: [],
    };
    for (const c of cards) map[c.bucket].push(c);
    return map;
  }, [cards]);

  // --- Render ---------------------------------------------------------------

  if (!mounted) {
    return (
      <div className="pt-1">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (loading && cards.length === 0) {
    return (
      <div className="pt-1">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="mt-8 px-2 py-12 text-center">
        <p className="text-[14px] leading-relaxed text-white/50">
          No important memories yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-9 pt-1">
      {BUCKET_ORDER.map((bucket) => {
        const items = grouped[bucket];
        if (items.length === 0) return null;

        return (
          <section key={bucket}>
            <SectionTitle title={bucket} />
            <div className="divide-y divide-white/[0.05]">
              {items.map((card) => (
                <div key={card.id} className="py-3.5 first:pt-0">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-[9.5px] uppercase tracking-[0.24em] text-violet-300/45">
                      Remembered
                    </span>
                    {card.relativeTime && (
                      <span className="shrink-0 text-[10px] tracking-[0.04em] text-white/25">
                        {card.relativeTime}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-white/70">
                    {card.text}
                  </p>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
