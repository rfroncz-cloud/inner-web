// ---------------------------------------------------------------------------
// Memory Importance & Reinforcement Engine v2
// ---------------------------------------------------------------------------
// Learns which memories matter most. Uses a tier-based floor system so scores
// are spread across the full 0-100 range instead of clustering in the middle.
//
// Tier overview (base floors before modifiers):
//   T1 — Core identity / family members            85–100
//   T2 — Major life project / life work            75–90
//   T3 — Professional identity / career            65–80
//   T4 — Long-term goals & aspirations             55–70
//   T5 — Stable repeated preferences               25–40
//   T6 — Generic one-time facts / minor prefs      10–20
//   T7 — Trivial / temporary / ephemeral           1–8
//
// Key examples (no extra modifiers):
//   "My wife is Anna"           → T1 → ~100
//   "My son is Kevin"           → T1 → ~100
//   "Building INNER"            → T2 → ~95
//   "I run veterinary clinics"  → T3 → ~90
//   "I like cabbage"            → T6 → ~8
//   "I ate pizza today"         → T7 → ~2
//
// Pure TypeScript. No AI calls, no embeddings. Does not mutate records.

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

// ─── Utility helpers ────────────────────────────────────────────────────────

function num(...vals: Array<number | undefined>): number {
  for (const v of vals) {
    if (typeof v === "number" && !Number.isNaN(v)) return v;
  }
  return 0;
}

function getText(m: ImportanceMemory): string {
  return (m.memory ?? m.text ?? "").toString();
}

function hasAny(lower: string, phrases: string[]): boolean {
  return phrases.some((p) => lower.includes(p));
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function daysSince(value?: string): number | null {
  if (!value) return null;
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return null;
  const diff = Date.now() - t;
  return diff < 0 ? 0 : diff / 86_400_000;
}

function repeatOf(m: ImportanceMemory): number {
  return num(m.repeat_count, m.repeatCount, 1) || 1;
}

function emotionalWeightOf(m: ImportanceMemory): number {
  return num(m.emotional_weight, m.emotionalWeight, 0);
}

function referencedOf(m: ImportanceMemory): number {
  return num(m.referenced_count, m.referencedCount, 0);
}

// ─── Tier keyword banks  ─────────────────────────────────────────────────────

// T1 — Core identity: family members and the user's own name.
// These are permanent, defining facts that INNER must never forget.
const T1_FAMILY_PHRASES = [
  // EN — spouse / partner
  "my wife", "my husband", "my partner", "my fiancé", "my fiancee",
  // EN — children
  "my son", "my daughter", "my kid", "my child", "my baby",
  // EN — parents
  "my mother", "my father", "my mom", "my dad", "my parents",
  // EN — siblings / close family
  "my brother", "my sister",
  // PL
  "moja żona", "mój mąż", "mój syn", "moja córka",
  "moja mama", "mój tata", "moja matka", "mój ojciec",
  "mój brat", "moja siostra",
  // Structured-fact formats (from factExtraction)
  "wife:", "husband:", "son:", "daughter:", "mother:", "father:",
  "partner:", "dog:", "cat:", "pet:",
  // Name intro
  "my name is", "i'm called", "call me", "mam na imię", "nazywam się",
];

// T1 — close pets (nearly as important as family for many users)
const T1_PET_PHRASES = [
  "my dog", "my cat", "my pet", "mój pies", "mój kot", "moje zwierzę",
];

// T2 — Major life project / life work the user is actively building.
const T2_PROJECT_PHRASES = [
  "building", "buduję", "building my", "working on my", "i'm building",
  "i am building", "we're building", "creating", "launching", "developing",
  "pracuję nad", "tworzę", "rozwijam",
];

// T2 helpers: project keywords that boost with name detection
const PROJECT_NOUNS = [
  "app", "startup", "company", "business", "product", "platform",
  "project", "projekt", "firma", "biznes", "aplikacja",
];

// T3 — Professional identity: role, career, industry.
const T3_PROFESSIONAL_PHRASES = [
  "i run", "i own", "i manage", "i work as", "i am a", "i'm a",
  "my job", "my career", "my business", "my company", "i am the ceo",
  "i am the founder", "i founded", "co-founder",
  "prowadzę", "zarządzam", "jestem", "moja praca", "moja firma",
];

// T4 — Long-term goals and aspirations.
const T4_GOAL_PHRASES = [
  "my goal", "my dream", "i want to", "i hope to", "aiming to",
  "i plan to", "long-term", "one day", "i'd like to",
  "mój cel", "marzę", "chcę", "planuję", "dążę",
];

// T5 — Stable / repeated preferences (only with recurrence signals).
const T5_STABLE_PREFERENCE_SIGNALS = [
  "always", "every day", "every morning", "every night", "every week",
  "i always", "i never", "since forever", "for years",
  "zawsze", "codziennie", "od lat",
];

// T7 — Ephemeral / one-time / trivial. Explicit ceiling: score will be ≤ 8.
const T7_TRIVIAL_PHRASES = [
  "ate", "eating", "i had", "i ate", "i just ate",
  "for breakfast", "for lunch", "for dinner", "for supper",
  "today i", "this morning", "this afternoon", "this evening",
  "just now", "right now",
  "zjadłem", "zjadłam", "jadłem", "jadłam", "na śniadanie", "na obiad",
];

// T7 — Simple one-off taste preferences without recurrence.
const TRIVIAL_LIKE_PHRASES = [
  "i like", "i enjoy", "i don't like", "i dislike", "i prefer",
  "lubię", "nie lubię", "wolę",
];

// ─── Tier detection ───────────────────────────────────────────────────────────

/**
 * Detect the memory's primary tier (1-7).
 * Lower tier number = higher importance floor.
 */
function detectTier(
  lower: string,
  category: string,
  type: string,
  repeat: number
): 1 | 2 | 3 | 4 | 5 | 6 | 7 {
  // T7 first — if it's clearly ephemeral, cap it immediately.
  if (hasAny(lower, T7_TRIVIAL_PHRASES)) return 7;

  // T1 — Core identity / family (category signal is reliable when set).
  if (
    category === "family" ||
    category === "identity" ||
    category === "pet" ||
    category === "name" ||
    hasAny(lower, T1_FAMILY_PHRASES) ||
    hasAny(lower, T1_PET_PHRASES)
  ) {
    return 1;
  }

  // T2 — Major project actively being built.
  if (hasAny(lower, T2_PROJECT_PHRASES) && hasAny(lower, PROJECT_NOUNS)) {
    return 2;
  }
  if (category === "project") return 2;

  // T3 — Professional identity.
  if (
    hasAny(lower, T3_PROFESSIONAL_PHRASES) ||
    category === "career" ||
    category === "business" ||
    type === "professional"
  ) {
    return 3;
  }

  // T4 — Long-term goals.
  if (
    hasAny(lower, T4_GOAL_PHRASES) ||
    category === "goal" ||
    category === "life_goal" ||
    type === "life_goal"
  ) {
    return 4;
  }

  // T5 — Stable repeated preference (needs an explicit recurrence signal).
  if (
    repeat >= 3 ||
    hasAny(lower, T5_STABLE_PREFERENCE_SIGNALS)
  ) {
    return 5;
  }

  // T7 — Simple one-off like/dislike (trivial preference).
  if (hasAny(lower, TRIVIAL_LIKE_PHRASES)) return 7;

  // T6 — Generic one-time fact with no strong signal.
  return 6;
}

/** Base floor for each tier. */
const TIER_BASE: Record<1 | 2 | 3 | 4 | 5 | 6 | 7, number> = {
  1: 88, // Core identity / family
  2: 78, // Major life project
  3: 65, // Professional identity
  4: 55, // Long-term goals
  5: 28, // Stable repeated preference
  6: 12, // Generic one-time fact
  7:  2, // Trivial / ephemeral
};

/** Max achievable score for each tier (before modifier clamping). */
const TIER_CEILING: Record<1 | 2 | 3 | 4 | 5 | 6 | 7, number> = {
  1: 100,
  2:  96,
  3:  88,
  4:  80,
  5:  50,
  6:  25,
  7:   8,
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Base importance (0-100).
 * Starts from the tier floor and adds modest modifiers for repeat,
 * emotional weight, relationship impact, and core_fact type signal.
 * The tier ceiling prevents low-tier memories from escaping their band.
 */
export function calculateMemoryImportance(memory: ImportanceMemory): number {
  if (!memory) return 0;

  const text     = getText(memory);
  const lower    = text.toLowerCase();
  const category = (memory.category ?? "").toLowerCase();
  const type     = (memory.type ?? "").toLowerCase();
  const repeat   = repeatOf(memory);

  const tier  = detectTier(lower, category, type, repeat);
  const base  = TIER_BASE[tier];
  const ceil  = TIER_CEILING[tier];

  let score = base;

  // +Repeat — mentioned more than once (signals the user cares about this).
  // Capped at 8 to stay within tier band.
  score += Math.min(repeat - 1, 4) * 2;

  // +Emotional weight — stronger feeling = more memorable.
  const ew = emotionalWeightOf(memory);
  score += Math.min(ew, 8) * 1.5;

  // +Relationship impact — affects how INNER relates to the user.
  const ri = num(memory.relationship_impact, 0);
  score += Math.min(ri, 8) * 1;

  // +core_fact type boost — explicitly tagged as a stable fact.
  if (type === "core_fact" && tier >= 3) score += 5;

  // Respect tier ceiling and global bounds.
  return clamp(Math.round(score), 0, ceil);
}

/**
 * Reinforcement bonus (0-60).
 * Grows when a memory keeps proving relevant through repeat saves,
 * conversational references, or strong emotion / goal connection.
 */
export function calculateReinforcementScore(memory: ImportanceMemory): number {
  if (!memory) return 0;

  const lower = getText(memory).toLowerCase();
  let score = 0;

  // Memory saved more than once — user keeps returning to the topic.
  const repeat = repeatOf(memory);
  if (repeat > 1) score += Math.min(repeat - 1, 5) * 6;

  // Referenced in conversation (not just saved).
  const referenced = referencedOf(memory);
  if (referenced > 0) score += Math.min(referenced, 5) * 5;

  // Strong emotional signal.
  const ew = emotionalWeightOf(memory);
  const ei = num(memory.emotionalIntensity, 0);
  if (ew >= 6 || ei >= 60) score += 12;

  // Goal / project connection — these compound over time.
  if (
    hasAny(lower, T4_GOAL_PHRASES) ||
    hasAny(lower, T2_PROJECT_PHRASES) ||
    hasAny(lower, PROJECT_NOUNS)
  ) {
    score += 8;
  }

  return clamp(Math.round(score), 0, 60);
}

/**
 * Decay penalty (0-40).
 * Trivial, stale, never-referenced memories earn a penalty so they sink
 * to the bottom when memories are sorted by rank.
 */
export function calculateDecayScore(memory: ImportanceMemory): number {
  if (!memory) return 0;

  const importance = calculateMemoryImportance(memory);
  const repeat     = repeatOf(memory);
  const referenced = referencedOf(memory);
  const text       = getText(memory);

  const ageDays    = daysSince(memory.created_at  ?? memory.createdAt)    ?? 0;
  const accessDays = daysSince(memory.last_accessed ?? memory.lastAccessed) ?? ageDays;

  let decay = 0;

  // Never referenced and mentioned only once — candidate for fading.
  if (referenced === 0 && repeat <= 1) decay += 8;

  // Old and low-importance — genuinely no longer relevant.
  if (ageDays >= 30 && importance < 40) decay += 12;
  else if (ageDays >= 14 && importance < 30) decay += 8;

  // Not touched in a long time.
  if (accessDays >= 21) decay += 6;

  // Inherently trivial (T6/T7) — apply an extra push to the bottom.
  if (importance < 15) decay += 8;
  if (text.trim().length < 12) decay += 4;

  return clamp(Math.round(decay), 0, 40);
}

/**
 * Final rank: importance + reinforcement - decay.
 * Higher = more important. Sort descending.
 */
export function getMemoryRank(memory: ImportanceMemory): number {
  return (
    calculateMemoryImportance(memory) +
    calculateReinforcementScore(memory) -
    calculateDecayScore(memory)
  );
}

/**
 * Returns up to `limit` memories sorted by rank, highest first.
 * Input records are never mutated.
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
    typeof limit === "number" && limit >= 0 ? ranked.slice(0, limit) : ranked;

  console.log(
    "TOP_MEMORIES",
    limited.map((x) => ({
      memory: getText(x.m).slice(0, 60),
      rank: x.rank,
    }))
  );

  return limited.map((x) => x.m);
}
