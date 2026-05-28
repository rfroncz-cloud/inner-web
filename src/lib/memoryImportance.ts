// ---------------------------------------------------------------------------
// Memory Importance & Reinforcement Engine v2
// ---------------------------------------------------------------------------
// Learns which memories matter most over time. Important memories (family,
// pets, goals, repeated/emotional facts) grow stronger; trivial, stale,
// never-referenced memories gradually fade.
//
// Pure TypeScript — no AI calls, no embeddings. This only improves *ranking*;
// it never deletes or mutates the underlying memory records.

export type ImportanceMemory = {
  id?: string;
  memory?: string;
  text?: string;
  type?: string;
  category?: string;
  importance?: number;
  emotional_weight?: number;
  emotionalWeight?: number;
  emotionalIntensity?: number;
  repeat_count?: number;
  repeatCount?: number;
  relationship_impact?: number;
  referenced_count?: number;
  referencedCount?: number;
  created_at?: string;
  createdAt?: string;
  last_accessed?: string;
  lastAccessed?: string;
};

const FAMILY_CATEGORIES = ["family", "identity"];
const PET_CATEGORIES = ["pet"];
const RELATIONSHIP_CATEGORIES = ["relationship", "values"];

const GOAL_KEYWORDS = [
  "goal",
  "dream",
  "cel",
  "marzenie",
  "i want to",
  "chcę",
  "chce",
];
const PROJECT_KEYWORDS = [
  "project",
  "projekt",
  "working on",
  "building",
  "pracuję nad",
  "pracuje nad",
  "buduję",
  "buduje",
];
const PREFERENCE_KEYWORDS = [
  "love",
  "favorite",
  "favourite",
  "lubię",
  "lubie",
  "uwielbiam",
  "always",
  "every day",
  "codziennie",
  "zawsze",
];

function num(...vals: Array<number | undefined>): number {
  for (const v of vals) {
    if (typeof v === "number" && !Number.isNaN(v)) return v;
  }
  return 0;
}

function getText(m: ImportanceMemory): string {
  return (m.memory ?? m.text ?? "").toString();
}

function includesAny(text: string, words: string[]): boolean {
  return words.some((w) => text.includes(w));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function daysSince(value?: string): number | null {
  if (!value) return null;
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return null;
  const diff = Date.now() - t;
  if (diff < 0) return 0;
  return diff / (1000 * 60 * 60 * 24);
}

function repeatCountOf(m: ImportanceMemory): number {
  return num(m.repeat_count, m.repeatCount, 1) || 1;
}

function emotionalWeightOf(m: ImportanceMemory): number {
  return num(m.emotional_weight, m.emotionalWeight, 1) || 1;
}

function referencedCountOf(m: ImportanceMemory): number {
  return num(m.referenced_count, m.referencedCount, 0);
}

/**
 * Base importance (0-100). Reflects how intrinsically meaningful a memory is:
 * repetition, emotion, family/pet/goal relevance, long-term preferences.
 */
export function calculateMemoryImportance(memory: ImportanceMemory): number {
  if (!memory) return 0;

  const text = getText(memory).toLowerCase();
  const category = (memory.category ?? "").toLowerCase();
  const type = (memory.type ?? "").toLowerCase();

  let score = 10;

  // Repeated by the user.
  const repeat = repeatCountOf(memory);
  score += Math.min(repeat, 6) * 5;

  // Emotional weight.
  const emotionalWeight = emotionalWeightOf(memory);
  score += Math.min(emotionalWeight, 10) * 2;

  // Relationship relevance.
  const relationshipImpact = num(memory.relationship_impact, 0);
  score += Math.min(relationshipImpact, 10) * 1.5;

  // Stable, identity-defining facts.
  if (type === "core_fact") score += 15;
  if (FAMILY_CATEGORIES.includes(category)) score += 18;
  if (PET_CATEGORIES.includes(category)) score += 14;
  if (category === "home") score += 10;
  if (RELATIONSHIP_CATEGORIES.includes(category)) score += 8;

  // Goals & projects.
  if (
    category === "goal" ||
    category === "project" ||
    includesAny(text, GOAL_KEYWORDS) ||
    includesAny(text, PROJECT_KEYWORDS)
  ) {
    score += 14;
  }

  // Long-term preferences.
  if (includesAny(text, PREFERENCE_KEYWORDS)) score += 6;

  // Any explicit importance already stored on the record.
  score += Math.min(num(memory.importance, 0), 20);

  return clamp(Math.round(score), 0, 100);
}

/**
 * Reinforcement bonus (0-60). Grows when a memory keeps proving relevant:
 * it reappears, gets referenced, ties to strong emotion or long-term goals.
 */
export function calculateReinforcementScore(memory: ImportanceMemory): number {
  if (!memory) return 0;

  const text = getText(memory).toLowerCase();
  let score = 0;

  // Memory appears again (repeated saves).
  const repeat = repeatCountOf(memory);
  if (repeat > 1) score += Math.min(repeat - 1, 5) * 6;

  // Memory referenced again in conversation.
  const referenced = referencedCountOf(memory);
  if (referenced > 0) score += Math.min(referenced, 5) * 5;

  // Memory connected to strong emotion.
  const emotionalWeight = emotionalWeightOf(memory);
  const emotionalIntensity = num(memory.emotionalIntensity, 0);
  if (emotionalWeight >= 6 || emotionalIntensity >= 60) score += 12;

  // Memory connected to long-term goals/projects.
  if (includesAny(text, GOAL_KEYWORDS) || includesAny(text, PROJECT_KEYWORDS)) {
    score += 8;
  }

  return clamp(Math.round(score), 0, 60);
}

/**
 * Decay penalty (0-40). Grows when a memory is never referenced again, old &
 * low-importance, or simply trivial. Subtracted from the final rank.
 */
export function calculateDecayScore(memory: ImportanceMemory): number {
  if (!memory) return 0;

  const importance = calculateMemoryImportance(memory);
  const repeat = repeatCountOf(memory);
  const referenced = referencedCountOf(memory);
  const text = getText(memory);

  const ageDays = daysSince(memory.created_at ?? memory.createdAt) ?? 0;
  const accessDays =
    daysSince(memory.last_accessed ?? memory.lastAccessed) ?? ageDays;

  let decay = 0;

  // Never referenced again.
  if (referenced === 0 && repeat <= 1) decay += 8;

  // Old and low importance.
  if (ageDays >= 30 && importance < 40) decay += 12;
  else if (ageDays >= 14 && importance < 30) decay += 8;

  // Not touched in a long time.
  if (accessDays >= 21) decay += 6;

  // Trivial information.
  if (importance < 25) decay += 6;
  if (text.trim().length < 12) decay += 4;

  return clamp(Math.round(decay), 0, 40);
}

/**
 * Final rank used for ordering: importance + reinforcement - decay.
 * Higher = more important. Can be slightly negative for fully faded items;
 * callers usually just sort by it.
 */
export function getMemoryRank(memory: ImportanceMemory): number {
  const importance = calculateMemoryImportance(memory);
  const reinforcement = calculateReinforcementScore(memory);
  const decay = calculateDecayScore(memory);
  return importance + reinforcement - decay;
}

/**
 * Returns the most important memories first. Pure ranking — input records are
 * not mutated.
 */
export function getTopMemories<T extends ImportanceMemory>(
  memories: T[],
  limit?: number
): T[] {
  const list = Array.isArray(memories) ? memories : [];

  const ranked = list
    .map((m) => ({ m, rank: getMemoryRank(m) }))
    .sort((a, b) => b.rank - a.rank);

  const limited =
    typeof limit === "number" && limit >= 0
      ? ranked.slice(0, limit)
      : ranked;

  console.log(
    "TOP_MEMORIES",
    limited.map((x) => ({
      memory: getText(x.m).slice(0, 60),
      rank: x.rank,
    }))
  );

  return limited.map((x) => x.m);
}
