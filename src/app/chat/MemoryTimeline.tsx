"use client";

import { useEffect, useMemo, useState } from "react";
import {
  analyzeRelationshipPatterns,
  type RelationshipPatternProfile,
} from "@/lib/relationshipPatterns";
import {
  filterMemoriesForPanel,
  memoryQualityScore,
  type MemoryLike as CleanupMemoryLike,
} from "@/lib/memoryCleanup";
import {
  extractStructuredFacts,
  structuredFactToLine,
} from "@/lib/factExtraction";
import { getMemoryRank } from "@/lib/memoryImportance";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TimelineTag = "recent" | "developing" | "older";

type TimelineItem = {
  id: string;
  text: string;
  tag: TimelineTag;
  sortScore: number;
};

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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_ITEMS = 7;
const MIN_CONFIDENCE = 25;

// Raw internal pattern keys must never appear as timeline text.
const RAW_PATTERN_KEYS = new Set([
  "avoidance",
  "loneliness",
  "pressure",
  "trust_issue",
  "fear_of_rejection",
  "emotional_withdrawal",
  "need_for_reassurance",
  "conflict",
  "rejection",
  "relationship_pattern",
]);

// Category labels that produce good readable timeline text.
const FACT_CATEGORIES = new Set([
  "identity",
  "family",
  "pet",
  "home",
  "birth",
  "work",
  "goal",
  "project",
  "values",
  "life_goal",
  "project_context",
  "life_context",
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ageDays(dateStr?: string): number | null {
  if (!dateStr) return null;
  const t = new Date(dateStr).getTime();
  if (Number.isNaN(t)) return null;
  const diff = Date.now() - t;
  return Math.max(0, diff / (1000 * 60 * 60 * 24));
}

function ageTag(dateStr?: string): TimelineTag {
  const days = ageDays(dateStr);
  if (days === null) return "older";
  if (days <= 3) return "recent";
  if (days <= 14) return "developing";
  return "older";
}

function isRawPatternKey(text: string): boolean {
  const stripped = text.trim().toLowerCase().replace(/[^a-z_]/g, "");
  return RAW_PATTERN_KEYS.has(stripped);
}

function isUsable(text: string): boolean {
  const t = text.trim();
  if (!t || t.length < 8) return false;
  if (t.endsWith("?")) return false;
  if (isRawPatternKey(t)) return false;
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length < 2) return false;
  return true;
}

function humanFactLine(text: string, memory: MemoryLikeForTimeline): string {
  // Already in "Label: Value" form — wrap it naturally.
  if (/^[A-Z][a-z]+:\s/.test(text)) {
    const [label, ...rest] = text.split(": ");
    const value = rest.join(": ");
    switch (label.toLowerCase()) {
      case "name":
        return `Name remembered as ${value}`;
      case "dog":
        return `Added ${value} as an important pet`;
      case "cat":
        return `Added ${value} as an important pet`;
      case "cats":
        return `Has ${value} cats — remembered`;
      case "dogs":
        return `Has ${value} dogs — remembered`;
      case "wife":
        return `Wife ${value} noted as important`;
      case "husband":
        return `Husband ${value} noted as important`;
      case "son":
        return `Son ${value} remembered`;
      case "daughter":
        return `Daughter ${value} remembered`;
      case "location":
        return `Lives in ${value}`;
      case "goal":
        return `Goal: ${value}`;
      case "project":
        return `Working on ${value}`;
      case "likes":
        return `Likes ${value}`;
      default:
        return text;
    }
  }
  // Longer narrative — strip "User" prefix and return as-is.
  return text.replace(/^User'?s?\s+/i, "").replace(/^User\s+/i, "");
}

function tagColor(tag: TimelineTag): string {
  switch (tag) {
    case "recent":
      return "text-violet-300/80";
    case "developing":
      return "text-sky-300/70";
    case "older":
      return "text-white/30";
  }
}

function dotColor(tag: TimelineTag): string {
  switch (tag) {
    case "recent":
      return "bg-violet-400 shadow-[0_0_6px_rgba(167,139,250,0.7)]";
    case "developing":
      return "bg-sky-400/80 shadow-[0_0_5px_rgba(56,189,248,0.5)]";
    case "older":
      return "bg-white/20";
  }
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function SkeletonItem() {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-white/10 animate-pulse" />
        <div className="mt-1 flex-1 w-px bg-white/[0.04]" />
      </div>
      <div className="pb-6 flex-1 min-w-0">
        <div className="h-2.5 w-16 rounded-full bg-white/10 animate-pulse" />
        <div className="mt-2.5 h-3 w-3/4 rounded-full bg-white/[0.06] animate-pulse" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function MemoryTimeline({ memories, lastUserMessage, loading = false }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // --- filtered + normalised memories (same pipeline as MemoryPanel) -------
  const reflectionMemories = useMemo(() => {
    if (!mounted) return [] as CleanupMemoryLike[];
    return filterMemoriesForPanel(
      (memories ?? []) as CleanupMemoryLike[]
    );
  }, [mounted, memories]);

  // --- relationship profile (tensions + evolution) -------------------------
  const profile = useMemo((): RelationshipPatternProfile | null => {
    if (!mounted || reflectionMemories.length === 0) return null;
    const mapped = reflectionMemories.map((m) => ({
      memory: m.memory,
      type: m.type,
      category: m.category,
      repeat_count: m.repeatCount,
      importance: m.importance,
      emotional_weight: m.emotionalWeight,
      created_at: m.created_at ?? m.createdAt,
      last_accessed: m.last_accessed ?? m.lastAccessed,
    }));
    return analyzeRelationshipPatterns(mapped, lastUserMessage ?? undefined);
  }, [mounted, reflectionMemories, lastUserMessage]);

  // --- assemble timeline items ---------------------------------------------
  const items = useMemo((): TimelineItem[] => {
    if (!mounted) return [];

    const result: TimelineItem[] = [];
    const seen = new Set<string>();

    function push(text: string, tag: TimelineTag, score: number, id: string) {
      const dedupeKey = text.trim().toLowerCase();
      if (!text.trim() || seen.has(dedupeKey)) return;
      if (!isUsable(text)) return;
      seen.add(dedupeKey);
      result.push({ id, text, tag, sortScore: score });
    }

    // 1. Structured facts from important memories (family, pet, goal, project…)
    const factMems = reflectionMemories
      .filter(
        (m) =>
          m.category && FACT_CATEGORIES.has(m.category)
          || m.type === "core_fact"
          || m.type === "life_goal"
          || m.type === "project_context"
          || m.type === "life_context"
      )
      .sort(
        (a, b) =>
          getMemoryRank(b as MemoryLikeForTimeline) -
          getMemoryRank(a as MemoryLikeForTimeline)
      )
      .slice(0, 6);

    for (const m of factMems) {
      const raw = (m.memory ?? "").trim();
      if (!raw) continue;
      const date = m.created_at ?? m.createdAt;
      const tag = ageTag(date);
      const rank = getMemoryRank(m as MemoryLikeForTimeline);

      const structured = extractStructuredFacts(raw);
      if (structured.length > 0) {
        for (const f of structured) {
          const line = structuredFactToLine(f);
          const human = humanFactLine(line, m);
          push(human, tag, rank, `fact::${line}`);
        }
      } else {
        const human = humanFactLine(raw, m);
        push(human, tag, rank, `mem::${raw.slice(0, 40)}`);
      }
    }

    // 2. High-importance narrative memories not already covered by facts.
    const narrativeMems = reflectionMemories
      .filter((m) => {
        if (!m.memory) return false;
        if (m.category && FACT_CATEGORIES.has(m.category)) return false;
        const score = memoryQualityScore(m);
        return score >= MIN_CONFIDENCE;
      })
      .sort(
        (a, b) =>
          getMemoryRank(b as MemoryLikeForTimeline) -
          getMemoryRank(a as MemoryLikeForTimeline)
      )
      .slice(0, 4);

    for (const m of narrativeMems) {
      const raw = (m.memory ?? "").trim();
      if (!raw || raw.length > 120) continue;
      const date = m.created_at ?? m.createdAt;
      const tag = ageTag(date);
      const rank = getMemoryRank(m as MemoryLikeForTimeline);
      const human = humanFactLine(raw, m);
      push(human, tag, rank, `narr::${raw.slice(0, 40)}`);
    }

    // 3. Emotional tensions (developing, since they're active contradictions).
    if (profile) {
      for (const t of profile.emotionalTensions) {
        if (t.confidence < MIN_CONFIDENCE) continue;
        push(t.summary, "developing", t.confidence, `tension::${t.summary.slice(0, 30)}`);
      }

      // 4. Relationship evolution (skip stable, use direction to pick tag).
      for (const e of profile.relationshipEvolution) {
        if (e.direction === "stable") continue;
        if (e.confidence < MIN_CONFIDENCE) continue;
        const tag: TimelineTag =
          e.direction === "improving" ? "recent"
          : e.direction === "conflicting" ? "developing"
          : "older";
        push(e.summary, tag, e.confidence, `evo::${e.summary.slice(0, 30)}`);
      }
    }

    // Sort: recent first, then by score.
    const tagOrder: Record<TimelineTag, number> = { recent: 0, developing: 1, older: 2 };
    result.sort(
      (a, b) =>
        tagOrder[a.tag] - tagOrder[b.tag] ||
        b.sortScore - a.sortScore
    );

    return result.slice(0, MAX_ITEMS);
  }, [mounted, reflectionMemories, profile]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (!mounted) {
    return (
      <div className="space-y-0 pt-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonItem key={i} />
        ))}
      </div>
    );
  }

  if (loading && items.length === 0) {
    return (
      <div className="space-y-0 pt-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonItem key={i} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mt-8 px-2 py-12 text-center">
        <p className="text-[14px] leading-relaxed text-white/50">
          INNER is still building your timeline.
        </p>
        <p className="mt-2 text-[12px] leading-relaxed text-white/25">
          Keep chatting and it will grow here.
        </p>
      </div>
    );
  }

  return (
    <div className="pt-1">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <div key={item.id} className="flex gap-4">
            {/* Vertical line + dot */}
            <div className="flex flex-col items-center">
              <div
                className={`mt-1 h-2 w-2 shrink-0 rounded-full ${dotColor(item.tag)}`}
              />
              {!isLast && (
                <div className="mt-1 flex-1 w-px bg-gradient-to-b from-white/10 to-transparent" />
              )}
            </div>

            {/* Content */}
            <div className={`pb-7 flex-1 min-w-0 ${isLast ? "pb-2" : ""}`}>
              <span
                className={`text-[9.5px] uppercase tracking-[0.24em] font-medium ${tagColor(item.tag)}`}
              >
                {item.tag}
              </span>
              <p className="mt-1.5 text-[13px] leading-relaxed text-white/70">
                {item.text}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
