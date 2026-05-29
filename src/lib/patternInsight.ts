// ---------------------------------------------------------------------------
// Pattern Insight Engine v1
// ---------------------------------------------------------------------------
// Memory recall answers "what do I know about this person?"
// Pattern insight answers "what do these memories, taken together, reveal?"
//
// This turns clusters of related memories into a single human observation, e.g.
//   - "INNER takes a lot of time" + "Clinics take a lot of time"
//        + "Acai Motion takes a lot of time"
//     -> "You often end up carrying several major responsibilities at once."
//   - "User trusts INNER" + "User returns to INNER daily"
//     -> "You seem to be treating INNER more like a partner than a tool."
//
// Rules:
//   - An insight only fires when at least 2 related memories support it.
//   - It only surfaces when confidence is high.
//   - No psychology / therapist labels — observations stay grounded in the
//     user's actual entities (projects, people, habits).
//
// Pure TypeScript. Lightweight keyword + canonical-grouping matching only.
// No AI calls, no embeddings, no vector search. Cost ≈ zero.

export type PatternMemory = {
  memory?: string;
  text?: string;
  category?: string;
  type?: string;
  repeat_count?: number;
  repeatCount?: number;
};

export type PatternInsight = {
  id: string;          // stable group id (e.g. "competing_responsibilities")
  observation: string; // natural-language observation to (optionally) use
  confidence: number;  // 0-100
  memberCount: number; // how many memories supported it
  members: string[];   // the memory texts behind it (for the audit log)
};

// Minimum supporting memories and confidence before an insight is allowed out.
const MIN_MEMBERS = 2;
const HIGH_CONFIDENCE = 60;

function getText(m: PatternMemory): string {
  return (m.memory ?? m.text ?? "").toString();
}

function repeatOf(m: PatternMemory): number {
  const r = (m.repeat_count ?? m.repeatCount ?? 1) as number;
  return Number.isFinite(r) && r > 0 ? r : 1;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

// ─── Canonical responsibilities ───────────────────────────────────────────────
// Known projects / life-work the user carries. Matching is case-insensitive and
// language-agnostic (the entity names are the same in EN and PL).
const RESPONSIBILITIES: { canonical: string; keywords: string[] }[] = [
  { canonical: "INNER",         keywords: ["inner"] },
  { canonical: "Acai Motion",   keywords: ["acai motion", "acai"] },
  { canonical: "the clinics",   keywords: ["clinic", "clinics", "klinik"] },
  { canonical: "Vet Emergency", keywords: ["vet emergency", "vet"] },
  { canonical: "YouTube",       keywords: ["youtube"] },
  { canonical: "music",         keywords: ["music", "muzyka"] },
];

// Signals that a memory is about load / time / juggling (EN + PL).
const LOAD_SIGNALS = [
  "time", "takes a lot", "a lot of time", "juggl", "at once", "too much",
  "too many", "overwhelm", "pressure", "responsib", "competing", "carry",
  "balance", "pogodzić", "pogodzic", "naraz", "za dużo", "za duzo", "czasu",
  "gryźć", "gryzc", "zabiera",
];

// Signals that a memory is about depending on / bonding with INNER.
const INNER_BOND_SIGNALS = [
  "trust", "every day", "daily", "understand my emotions", "most important",
  "build inner", "rely", "partner", "ufam", "codziennie", "najważniejsz",
];

function hasAny(lower: string, words: string[]): boolean {
  return words.some((w) => lower.includes(w));
}

// ─── Insight detectors ─────────────────────────────────────────────────────────

function detectCompetingResponsibilities(
  memories: PatternMemory[]
): PatternInsight | null {
  const distinct = new Map<string, string>(); // canonical -> sample text
  let repeatBoost = 0;

  for (const m of memories) {
    const text = getText(m);
    if (!text.trim()) continue;
    const lower = text.toLowerCase();
    const category = (m.category ?? "").toLowerCase();

    const isLoadContext =
      hasAny(lower, LOAD_SIGNALS) ||
      ["goal", "project", "work", "career", "business", "life_context"].includes(
        category
      );
    if (!isLoadContext) continue;

    for (const r of RESPONSIBILITIES) {
      if (hasAny(lower, r.keywords)) {
        if (!distinct.has(r.canonical)) distinct.set(r.canonical, text);
        if (repeatOf(m) > 1) repeatBoost += 4;
      }
    }
  }

  const count = distinct.size;
  if (count < MIN_MEMBERS) return null;

  // More distinct responsibilities + repeats = higher confidence.
  const confidence = clamp(45 + count * 14 + repeatBoost, 0, 100);

  return {
    id: "competing_responsibilities",
    observation:
      "You often end up carrying several major responsibilities at once.",
    confidence,
    memberCount: count,
    members: [...distinct.values()],
  };
}

function detectInnerAsPartner(
  memories: PatternMemory[]
): PatternInsight | null {
  const members: string[] = [];
  let repeatBoost = 0;

  for (const m of memories) {
    const text = getText(m);
    if (!text.trim()) continue;
    const lower = text.toLowerCase();
    if (!lower.includes("inner")) continue;
    if (hasAny(lower, INNER_BOND_SIGNALS)) {
      members.push(text);
      if (repeatOf(m) > 1) repeatBoost += 6;
    }
  }

  if (members.length < MIN_MEMBERS) return null;

  const confidence = clamp(48 + members.length * 12 + repeatBoost, 0, 100);

  return {
    id: "inner_as_partner",
    observation:
      "You seem to be treating INNER more like a partner than a tool.",
    confidence,
    memberCount: members.length,
    members,
  };
}

const DETECTORS: ((m: PatternMemory[]) => PatternInsight | null)[] = [
  detectCompetingResponsibilities,
  detectInnerAsPartner,
];

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Compute all qualifying pattern insights from a set of memories.
 * Only insights backed by >= MIN_MEMBERS memories AND >= HIGH_CONFIDENCE are
 * returned, sorted by confidence (highest first).
 */
export function computePatternInsights(
  memories: PatternMemory[]
): PatternInsight[] {
  if (!Array.isArray(memories) || memories.length === 0) return [];

  const insights: PatternInsight[] = [];
  for (const detect of DETECTORS) {
    const insight = detect(memories);
    if (insight && insight.confidence >= HIGH_CONFIDENCE) insights.push(insight);
  }

  return insights.sort((a, b) => b.confidence - a.confidence);
}

/** The single strongest insight, or null if none qualify. */
export function getTopPatternInsight(
  memories: PatternMemory[]
): PatternInsight | null {
  return computePatternInsights(memories)[0] ?? null;
}

/**
 * Audit helper — run every detector and return ALL generated candidates,
 * including ones below the confidence threshold (so the audit can show why a
 * pattern was NOT selected). Does not affect production selection.
 */
export function computeAllPatternCandidates(
  memories: PatternMemory[]
): PatternInsight[] {
  if (!Array.isArray(memories) || memories.length === 0) return [];
  const out: PatternInsight[] = [];
  for (const detect of DETECTORS) {
    const insight = detect(memories);
    if (insight) out.push(insight);
  }
  return out.sort((a, b) => b.confidence - a.confidence);
}

/** Audit helper — the confidence threshold a pattern must clear to be used. */
export const PATTERN_CONFIDENCE_THRESHOLD = HIGH_CONFIDENCE;
