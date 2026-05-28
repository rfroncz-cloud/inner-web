"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  analyzeRelationshipPatterns,
  type RelationshipEvolution,
  type RelationshipPatternProfile,
  type RelationshipPatternType,
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

// Anti-creepy thresholds. Anything below LOW is hidden entirely.
const HIDE_BELOW = 25;
const LOW = 25;
const MEDIUM = 45;
const HIGH = 70;

// Hard caps per section so the panel stays calm and uncluttered.
const MAX_REMEMBERED = 5;
const MAX_EMOTIONAL_SIGNALS = 3;
const MAX_RELATIONSHIP_PATTERNS = 3;
const MAX_TIMELINE = 5;

type ConfidenceLabel = "Low confidence" | "Medium confidence" | "High confidence";

function confidenceLabel(conf: number): ConfidenceLabel | null {
  if (conf < HIDE_BELOW) return null;
  if (conf >= HIGH) return "High confidence";
  if (conf >= MEDIUM) return "Medium confidence";
  if (conf >= LOW) return "Low confidence";
  return null;
}

const EMOTIONAL_SIGNAL_LABELS: Record<RelationshipPatternType, string> = {
  pressure: "Pressure sensitivity",
  loneliness: "Loneliness",
  emotional_withdrawal: "Emotional exhaustion",
  fear_of_rejection: "Self-protection",
  avoidance: "Quiet distance",
  trust_issue: "Cautious openness",
  need_for_reassurance: "Need for closeness",
  conflict_sensitivity: "Sensitivity to tension",
};

const RELATIONSHIP_PATTERN_LABELS: Record<RelationshipPatternType, string> = {
  avoidance: "Needs space when emotions feel intense",
  pressure: "Sensitive to pressure or expectations",
  loneliness: "May feel disconnected sometimes",
  trust_issue: "Takes time to fully trust",
  emotional_withdrawal: "Pulls back when things feel too heavy",
  need_for_reassurance: "Needs signs that closeness is safe",
  fear_of_rejection: "May protect himself before feeling rejected",
  conflict_sensitivity: "Holds back when tension rises",
};

export type MemoryLikeForPanel = {
  type?: string;
  memory?: string;
  category?: string;
  importance?: number;
  emotionalWeight?: number;
  repeatCount?: number;
  createdAt?: string;
  created_at?: string;
  lastAccessed?: string;
  last_accessed?: string;
  emotionalLayer?: string;
  emotionalTrigger?: string;
  emotionalIntensity?: number;
  entityName?: string;
  relationToUser?: string;
};

export type ReflectionFocus =
  | "all"
  | "remembered"
  | "emotions"
  | "patterns"
  | "timeline";

type MemoryPanelProps = {
  loading?: boolean;
  memories: MemoryLikeForPanel[];
  lastUserMessage?: string | null;
  onClearAll?: () => void;
  focus?: ReflectionFocus;
};

const FACT_CATEGORIES = new Set([
  "core_fact",
  "identity",
  "family",
  "pet",
  "birthday",
  "age",
  "location",
  "work",
  "project",
  "business",
  "relationship",
  "habit",
  "belief",
  "dream",
  "goal",
]);

function memoryKey(m: MemoryLikeForPanel): string {
  return `${m.type ?? ""}::${m.memory ?? ""}`;
}

function isLikelyFactMemory(m: MemoryLikeForPanel): boolean {
  if (m.category && FACT_CATEGORIES.has(m.category)) return true;
  if (m.type === "identity") return true;
  if (m.type === "core_fact") return true;
  if (m.type === "life_goal") return true;
  if (m.type === "important_story") return true;
  if (m.type === "project_context") return true;
  if (m.type === "life_context") return true;
  if (m.entityName) return true;
  return false;
}

// Single list wrapper — never switch between space-y-* and divide-y-*.
const LIST_CLASS = "divide-y divide-white/[0.04]";

function ListShell({ children }: { children: ReactNode }) {
  return <div className={LIST_CLASS}>{children}</div>;
}

function SkeletonRow() {
  return (
    <div className="py-2.5">
      <div className="h-2.5 w-20 rounded-full bg-white/10 animate-pulse" />
      <div className="mt-2 h-3 w-3/4 max-w-[240px] rounded-full bg-white/[0.06] animate-pulse" />
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <p className="mb-4 text-[10px] uppercase tracking-[0.3em] text-violet-200/40">
      {title}
    </p>
  );
}

const PANEL_SECTIONS = [
  "Remembered",
  "Emotional Signals",
  "Relationship Patterns",
  "Timeline",
] as const;

function PanelBodySkeleton({ focus }: { focus: ReflectionFocus }) {
  const titles =
    focus === "all"
      ? (PANEL_SECTIONS as readonly string[])
      : focus === "remembered"
      ? ["Remembered"]
      : focus === "emotions"
      ? ["Emotional Signals"]
      : focus === "patterns"
      ? ["Relationship Patterns"]
      : ["Timeline"];

  return (
    <>
      {titles.map((title) => (
        <section key={title}>
          <SectionTitle title={title} />
          <ListShell>
            <SkeletonRow />
            <SkeletonRow />
          </ListShell>
        </section>
      ))}
    </>
  );
}

function ConfidenceTag({ label }: { label: ConfidenceLabel }) {
  const tone =
    label === "High confidence"
      ? "text-violet-100/55"
      : label === "Medium confidence"
      ? "text-violet-200/40"
      : "text-white/25";
  return (
    <span className={`text-[9px] uppercase tracking-[0.22em] ${tone}`}>
      {label.toLowerCase()}
    </span>
  );
}

function PlainRow({
  text,
  confidence,
  onHide,
}: {
  text: string;
  confidence?: number;
  onHide?: () => void;
}) {
  const label = confidence != null ? confidenceLabel(confidence) : null;
  return (
    <div className="group flex items-start justify-between gap-4 py-2.5">
      <div className="flex-1">
        <p className="text-[14px] leading-relaxed text-white/70">{text}</p>
        {label && (
          <div className="mt-1.5">
            <ConfidenceTag label={label} />
          </div>
        )}
      </div>
      {onHide && (
        <button
          type="button"
          onClick={onHide}
          className="shrink-0 mt-1 text-[9px] uppercase tracking-[0.22em] text-white/20 opacity-0 transition group-hover:opacity-100 hover:text-violet-200/80"
        >
          Hide
        </button>
      )}
    </div>
  );
}

type TimelineKind = "recent" | "older" | "developing";

function timelineLabelTone(kind: TimelineKind): string {
  switch (kind) {
    case "recent":
      return "text-violet-200/55";
    case "developing":
      return "text-blue-200/50";
    case "older":
    default:
      return "text-white/30";
  }
}

function TimelineRow({ text, kind }: { text: string; kind: TimelineKind }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div
        className={`
          mt-2 h-1.5 w-1.5 shrink-0 rounded-full
          ${
            kind === "recent"
              ? "bg-violet-300/80 shadow-[0_0_8px_rgba(196,181,253,0.6)]"
              : kind === "developing"
              ? "bg-blue-300/70 shadow-[0_0_8px_rgba(147,197,253,0.5)]"
              : "bg-white/25"
          }
        `}
      />
      <div className="flex-1">
        <p className="text-[14px] leading-relaxed text-white/65">{text}</p>
        <p className={`mt-1 text-[9px] uppercase tracking-[0.22em] ${timelineLabelTone(kind)}`}>
          {kind}
        </p>
      </div>
    </div>
  );
}

export function MemoryPanel({
  loading = false,
  memories,
  lastUserMessage,
  onClearAll,
  focus = "all",
}: MemoryPanelProps) {
  const [mounted, setMounted] = useState(false);
  const [hiddenKeys, setHiddenKeys] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      const h = localStorage.getItem("inner_memory_panel_hidden");
      if (h) setHiddenKeys(JSON.parse(h));
    } catch {
      // ignore
    }
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("inner_memory_panel_hidden", JSON.stringify(hiddenKeys));
  }, [mounted, hiddenKeys]);

  const hideMemory = (key: string) => {
    setHiddenKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));
  };

  const reflectionMemories = useMemo(() => {
    if (!mounted) return [] as MemoryLikeForPanel[];
    const cleaned = filterMemoriesForPanel(
      memories as CleanupMemoryLike[]
    );
    const hidden = new Set(hiddenKeys);
    return (cleaned as MemoryLikeForPanel[]).filter(
      (m) => !hidden.has(memoryKey(m))
    );
  }, [mounted, memories, hiddenKeys]);

  const profile: RelationshipPatternProfile | null = useMemo(() => {
    if (!mounted) return null;
    if (memories.length === 0 && !lastUserMessage) return null;
    const mapped = memories.map((m) => ({
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
  }, [mounted, memories, lastUserMessage]);

  const remembered = useMemo(() => {
    const sourceFacts = reflectionMemories
      .filter(isLikelyFactMemory)
      .map((m) => ({ m, conf: memoryQualityScore(m), rank: getMemoryRank(m) }))
      .filter((x) => confidenceLabel(x.conf) !== null);

    type RememberedItem = {
      key: string;
      text: string;
      conf: number;
      sourceKey: string;
      priority: number;
      rank: number;
    };

    // family / pets / location / goals first, then preferences, then other.
    const factTypePriority = (type?: string): number => {
      switch (type) {
        case "name":
        case "family":
        case "pet":
        case "location":
        case "goal":
        case "project":
          return 0;
        case "preference":
          return 1;
        default:
          return 2;
      }
    };

    const items: RememberedItem[] = [];
    const seen = new Set<string>();

    for (const { m, conf, rank } of sourceFacts) {
      const text = (m.memory || "").trim();
      if (!text) continue;
      const sourceKey = memoryKey(m);
      const structured = extractStructuredFacts(text);

      if (structured.length > 0) {
        // Clean, single-fact lines extracted from the memory.
        for (const f of structured) {
          const line = structuredFactToLine(f);
          const dedupeKey = line.toLowerCase();
          if (!line || seen.has(dedupeKey)) continue;
          seen.add(dedupeKey);
          items.push({
            key: `${sourceKey}::${line}`,
            text: line,
            conf,
            sourceKey,
            priority: factTypePriority(f.type),
            rank,
          });
        }
      } else {
        // No structured fact: only keep short, already-clean facts (e.g.
        // "Dog: Rio"). Raw long / narrative memories are intentionally hidden.
        if (text.length > 50) continue;
        const dedupeKey = text.toLowerCase();
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        items.push({
          key: `${sourceKey}::${text}`,
          text,
          conf,
          sourceKey,
          priority: 2,
          rank,
        });
      }
    }

    // Category priority first, then learned importance within each group.
    items.sort((a, b) => a.priority - b.priority || b.rank - a.rank);

    return items.slice(0, MAX_REMEMBERED);
  }, [reflectionMemories]);

  const emotionalSignals = useMemo(() => {
    if (!profile) return [];
    return profile.signals
      .filter((s) => confidenceLabel(s.finalConfidence) !== null)
      .sort((a, b) => b.finalConfidence - a.finalConfidence)
      .slice(0, MAX_EMOTIONAL_SIGNALS)
      .map((s) => ({
        label: EMOTIONAL_SIGNAL_LABELS[s.type],
        confidence: s.finalConfidence,
      }));
  }, [profile]);

  const relationshipPatterns = useMemo(() => {
    if (!profile) return [];
    return profile.signals
      .filter((s) => confidenceLabel(s.finalConfidence) !== null)
      .sort((a, b) => b.finalConfidence - a.finalConfidence)
      .slice(0, MAX_RELATIONSHIP_PATTERNS)
      .map((s) => ({
        label: RELATIONSHIP_PATTERN_LABELS[s.type],
        confidence: s.finalConfidence,
      }));
  }, [profile]);

  const timeline = useMemo(() => {
    if (!profile) return [] as { text: string; kind: TimelineKind; sort: number }[];

    const items: { text: string; kind: TimelineKind; sort: number }[] = [];

    profile.emotionalTensions
      .filter((t) => confidenceLabel(t.confidence) !== null)
      .forEach((t) => {
        items.push({
          text: t.summary,
          kind: "developing",
          sort: t.confidence,
        });
      });

    profile.relationshipEvolution
      .filter((e) => e.direction !== "stable")
      .filter((e) => confidenceLabel(e.confidence) !== null)
      .forEach((e) => {
        const kind: TimelineKind = evolutionKind(e);
        items.push({
          text: e.summary,
          kind,
          sort: e.confidence,
        });
      });

    return items.sort((a, b) => b.sort - a.sort).slice(0, MAX_TIMELINE);
  }, [profile]);

  const showRemembered = focus === "all" || focus === "remembered";
  const showEmotions = focus === "all" || focus === "emotions";
  const showPatterns = focus === "all" || focus === "patterns";
  const showTimeline = focus === "all" || focus === "timeline";

  const isEmpty =
    mounted &&
    !loading &&
    (!showRemembered || remembered.length === 0) &&
    (!showEmotions || emotionalSignals.length === 0) &&
    (!showPatterns || relationshipPatterns.length === 0) &&
    (!showTimeline || timeline.length === 0);

  return (
    <div className="space-y-10">
      {!mounted ? (
        <PanelBodySkeleton focus={focus} />
      ) : isEmpty ? (
        <div className="mt-6 px-2 py-12 text-center">
          <p className="text-[14px] leading-relaxed text-white/55">
            INNER is still learning.
          </p>
          <p className="mt-2 text-[12px] leading-relaxed text-white/30">
            Nothing important to show yet.
          </p>
        </div>
      ) : (
        <>
          {showRemembered && (
            <section>
              <SectionTitle title="Remembered" />
              {loading && remembered.length === 0 ? (
                <ListShell>
                  <SkeletonRow />
                  <SkeletonRow />
                </ListShell>
              ) : remembered.length === 0 ? (
                <p className="text-[12.5px] leading-relaxed text-white/25">
                  Nothing concrete yet.
                </p>
              ) : (
                <ListShell>
                  {remembered.map((item) => (
                    <PlainRow
                      key={item.key}
                      text={item.text}
                      confidence={item.conf}
                      onHide={() => hideMemory(item.sourceKey)}
                    />
                  ))}
                </ListShell>
              )}
            </section>
          )}

          {showEmotions && (
            <section>
              <SectionTitle title="Emotional Signals" />
              {loading && emotionalSignals.length === 0 ? (
                <ListShell>
                  <SkeletonRow />
                </ListShell>
              ) : emotionalSignals.length === 0 ? (
                <p className="text-[12.5px] leading-relaxed text-white/25">
                  Nothing strong enough to name yet.
                </p>
              ) : (
                <ListShell>
                  {emotionalSignals.map((s) => (
                    <PlainRow
                      key={s.label}
                      text={s.label}
                      confidence={s.confidence}
                    />
                  ))}
                </ListShell>
              )}
            </section>
          )}

          {showPatterns && (
            <section>
              <SectionTitle title="Relationship Patterns" />
              {loading && relationshipPatterns.length === 0 ? (
                <ListShell>
                  <SkeletonRow />
                </ListShell>
              ) : relationshipPatterns.length === 0 ? (
                <p className="text-[12.5px] leading-relaxed text-white/25">
                  No recurring patterns yet.
                </p>
              ) : (
                <ListShell>
                  {relationshipPatterns.map((p) => (
                    <PlainRow
                      key={p.label}
                      text={p.label}
                      confidence={p.confidence}
                    />
                  ))}
                </ListShell>
              )}
            </section>
          )}

          {showTimeline && (
            <section>
              <SectionTitle title="Timeline" />
              {loading && timeline.length === 0 ? (
                <ListShell>
                  <SkeletonRow />
                </ListShell>
              ) : timeline.length === 0 ? (
                <p className="text-[12.5px] leading-relaxed text-white/25">
                  Nothing shifting yet.
                </p>
              ) : (
                <ListShell>
                  {timeline.map((item, i) => (
                    <TimelineRow
                      key={`tl-${i}`}
                      text={item.text}
                      kind={item.kind}
                    />
                  ))}
                </ListShell>
              )}
            </section>
          )}
        </>
      )}

      {mounted && hiddenKeys.length > 0 && (
        <div className="pt-2 flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.22em] text-white/30">
          <span>{hiddenKeys.length} hidden</span>
          <button
            type="button"
            onClick={() => setHiddenKeys([])}
            className="text-violet-200/55 hover:text-violet-100/80 transition"
          >
            Restore
          </button>
        </div>
      )}

      {onClearAll && (
        <div className="pt-4 flex items-center justify-between gap-4 border-t border-white/5 mt-6">
          <p className="text-[10px] uppercase tracking-[0.22em] text-white/30">
            Reflective · not diagnostic
          </p>
          <button
            type="button"
            onClick={onClearAll}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-white/40 transition hover:bg-white/[0.08] hover:text-white/70"
          >
            Clear memory
          </button>
        </div>
      )}
    </div>
  );
}

function evolutionKind(e: RelationshipEvolution): TimelineKind {
  if (e.confidence >= 60) return "recent";
  return "developing";
}
