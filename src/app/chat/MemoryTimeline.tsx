"use client";

// ---------------------------------------------------------------------------
// Memory Timeline v2
// ---------------------------------------------------------------------------
// Shows memories as a life history grouped by recency.
// Each card shows: text, human-readable type/category, importance, emotional
// weight. No AI calls. UI only. No Supabase schema changes.

import { useEffect, useMemo, useState } from "react";
import {
  filterMemoriesForPanel,
  type MemoryLike as CleanupMemoryLike,
} from "@/lib/memoryCleanup";

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
  label: string | null;        // human-readable type/category
  importanceBar: number | null; // 0–100, shown as a thin bar
  emotionDot: string | null;   // tailwind colour class for the dot
  relativeTime: string | null;
  bucket: Bucket;
  ts: number;
};

const HOUR = 1000 * 60 * 60;
const DAY  = HOUR * 24;

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseTime(value?: string): number | null {
  if (!value) return null;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? null : t;
}

function bucketFor(ageMs: number | null): Bucket {
  if (ageMs === null) return "Earlier";
  if (ageMs < DAY)      return "Today";
  if (ageMs < DAY * 7)  return "This Week";
  if (ageMs < DAY * 30) return "This Month";
  return "Earlier";
}

function relativeLabel(ts: number | null): string | null {
  if (ts === null) return null;
  const diff = Math.max(0, Date.now() - ts);
  if (diff < 60_000)       return "Just now";
  if (diff < HOUR)         return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < DAY)          return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < DAY * 2)      return "Yesterday";
  if (diff < DAY * 7)      return `${Math.floor(diff / DAY)}d ago`;
  if (diff < DAY * 14)     return "Last week";
  if (diff < DAY * 30)     return `${Math.floor(diff / (DAY * 7))}w ago`;
  if (diff < DAY * 60)     return "Last month";
  return `${Math.floor(diff / (DAY * 30))} months ago`;
}

// Map raw internal type/category keys → short human labels.
// Unknown keys fall through to null (no label shown).
const TYPE_LABELS: Record<string, string> = {
  core_fact:    "Fact",
  life_context: "Context",
  life_goal:    "Goal",
  preference:   "Preference",
  emotional:    "Feeling",
  relationship: "Relationship",
  family:       "Family",
  pet:          "Pet",
  birthday:     "Birthday",
  location:     "Location",
  project:      "Project",
  goal:         "Goal",
  name:         "Name",
  other:        "",          // suppress "other"
};

function humanLabel(type?: string, category?: string): string | null {
  const candidates = [category, type].filter(Boolean) as string[];
  for (const c of candidates) {
    const mapped = TYPE_LABELS[c.toLowerCase()];
    if (mapped !== undefined) return mapped || null;
  }
  return null;
}

// Map emotional layer → tailwind colour classes for the accent dot.
const EMOTION_COLORS: Record<string, string> = {
  hope:     "bg-emerald-400/70",
  love:     "bg-pink-400/70",
  identity: "bg-violet-400/70",
  pressure: "bg-amber-400/70",
  fear:     "bg-orange-400/70",
  anger:    "bg-red-400/70",
  sadness:  "bg-blue-400/60",
  neutral:  "bg-white/20",
};

function emotionColor(layer?: string): string | null {
  if (!layer) return null;
  return EMOTION_COLORS[layer.toLowerCase()] ?? null;
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="py-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-2 w-14 rounded-full bg-white/10 animate-pulse" />
        <div className="h-2 w-10 rounded-full bg-white/[0.06] animate-pulse ml-auto" />
      </div>
      <div className="h-3 w-3/4 rounded-full bg-white/[0.07] animate-pulse" />
      <div className="mt-1.5 h-2.5 w-1/2 rounded-full bg-white/[0.04] animate-pulse" />
    </div>
  );
}

function SectionLabel({ title }: { title: string }) {
  return (
    <p className="mb-4 text-[10px] uppercase tracking-[0.32em] text-violet-200/40">
      {title}
    </p>
  );
}

function ImportancePill({ value }: { value: number }) {
  // Only show when importance is high enough to be meaningful.
  if (value < 50) return null;
  const label = value >= 90 ? "Core" : value >= 70 ? "High" : "Noted";
  const color =
    value >= 90
      ? "border-violet-300/30 text-violet-200/60"
      : value >= 70
      ? "border-white/15 text-white/45"
      : "border-white/[0.08] text-white/30";
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] ${color}`}>
      {label}
    </span>
  );
}

function Card({ card }: { card: TimelineCard }) {
  return (
    <div className="py-4 first:pt-0">
      {/* Top row: label + importance pill on left, time on right */}
      <div className="mb-1.5 flex items-center gap-2">
        {card.emotionDot && (
          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${card.emotionDot}`} />
        )}
        {card.label && (
          <span className="text-[9.5px] uppercase tracking-[0.22em] text-violet-300/45">
            {card.label}
          </span>
        )}
        {card.importanceBar !== null && (
          <ImportancePill value={card.importanceBar} />
        )}
        {card.relativeTime && (
          <span className="ml-auto shrink-0 text-[10px] tabular-nums text-white/25">
            {card.relativeTime}
          </span>
        )}
      </div>

      {/* Memory text */}
      <p className="text-[13.5px] font-light leading-relaxed text-white/75">
        {card.text}
      </p>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

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

      const ts    = parseTime(m.created_at ?? m.createdAt);
      const ageMs = ts === null ? null : Date.now() - ts;
      const imp   = m.importance ?? null;
      const ew    = (m.emotionalWeight ?? m.emotional_weight) ?? null;

      out.push({
        id:           key,
        text,
        label:        humanLabel(m.type, m.category),
        importanceBar: imp,
        // Use emotional weight to tint the dot when there's no layer signal.
        emotionDot:   emotionColor(m.emotionalLayer) ??
                      (ew !== null && ew >= 6 ? "bg-violet-300/50" : null),
        relativeTime: relativeLabel(ts),
        bucket:       bucketFor(ageMs),
        ts:           ts ?? 0,
      });
    }

    // Newest first within each bucket.
    out.sort((a, b) => b.ts - a.ts);
    return out;
  }, [mounted, memories]);

  const grouped = useMemo(() => {
    const map: Record<Bucket, TimelineCard[]> = {
      Today: [], "This Week": [], "This Month": [], Earlier: [],
    };
    for (const c of cards) map[c.bucket].push(c);
    return map;
  }, [cards]);

  // --- Render -----------------------------------------------------------------

  if (!mounted) {
    return (
      <div className="pt-1">
        <SkeletonCard /><SkeletonCard /><SkeletonCard />
      </div>
    );
  }

  if (loading && cards.length === 0) {
    return (
      <div className="pt-1">
        <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="mt-8 px-2 py-14 text-center">
        <p className="text-[14px] font-light leading-relaxed text-white/40">
          INNER has not built enough timeline yet.
        </p>
        <p className="mt-2 text-[11px] text-white/20">
          Keep chatting — memories will appear here over time.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pt-1 pb-4">
      {BUCKET_ORDER.map((bucket) => {
        const items = grouped[bucket];
        if (items.length === 0) return null;

        return (
          <section key={bucket}>
            <SectionLabel title={bucket} />
            <div className="divide-y divide-white/[0.05] rounded-2xl border border-white/[0.05] bg-white/[0.015] px-4">
              {items.map((card) => (
                <Card key={card.id} card={card} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
