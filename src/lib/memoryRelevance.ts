// ---------------------------------------------------------------------------
// Memory Relevance Ranking v1
// ---------------------------------------------------------------------------
// Importance answers "how much does this matter in general?"
// Relevance answers "how much does this matter RIGHT NOW, given what the user
// just said?"
//
// Final selection blends both equally:
//     FinalScore = (Importance * 0.5) + (Relevance * 0.5)
//
// This stops permanently-important-but-irrelevant memories (e.g. "Dog: Rio")
// from crowding out context-relevant ones (e.g. "Building INNER") when the
// user is talking about being overloaded with work.
//
// Pure TypeScript. Lightweight keyword / theme / token-overlap matching only.
// No AI calls, no embeddings, no vector search. Cost ≈ zero.

import {
  calculateMemoryImportance,
  type ImportanceMemory,
} from "@/lib/memoryImportance";

export type RelevanceContext = {
  userMessage: string;
};

// ─── Token utilities ────────────────────────────────────────────────────────

// Common words that carry no topical signal — excluded from overlap matching.
const STOPWORDS = new Set([
  "the", "and", "for", "with", "that", "this", "have", "has", "had", "are",
  "was", "were", "you", "your", "i'm", "i've", "but", "not", "all", "too",
  "very", "just", "now", "today", "about", "what", "when", "how", "why",
  "they", "them", "its", "our", "out", "can", "will", "would", "could",
  "from", "into", "than", "then", "some", "more", "most", "much", "many",
  // PL
  "jest", "się", "sie", "nie", "tak", "ale", "oraz", "tego", "tym", "jak",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9ąćęłńóśźż\s]/gi, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w));
}

function getText(m: ImportanceMemory): string {
  return (m.memory ?? m.text ?? "").toString();
}

function repeatOf(m: ImportanceMemory): number {
  const r = (m.repeat_count ?? m.repeatCount ?? 1) as number;
  return Number.isFinite(r) && r > 0 ? r : 1;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

// ─── Theme banks ─────────────────────────────────────────────────────────────
// A "theme" lets a memory be relevant even without exact word overlap.
// If both the message AND the memory hit the same theme, relevance rises.

const THEMES: Record<string, string[]> = {
  overload: [
    "too many", "too much", "overwhelm", "overwhelmed", "juggling", "at once",
    "everything at", "burnt out", "burnout", "no time", "stretched", "so much",
    "spread thin", "can't keep up", "all at the same time", "too much going on",
    // Polish
    "za dużo", "za duzo", "za dużo rzeczy", "za duzo rzeczy", "przytłocz",
    "przytlocz", "naraz", "nie wyrabiam", "brak czasu", "za dużo pracy",
    "za duzo pracy", "za dużo projektów", "za duzo projektow", "dużo czasu",
    "duzo czasu", "zabiera mi", "wszystko naraz",
  ],
  work: [
    "work", "working", "job", "clinic", "clinics", "business", "company",
    "startup", "client", "deadline", "office", "career",
    // Polish
    "praca", "pracy", "pracę", "firma", "firmy", "robota",
  ],
  projects: [
    "project", "projects", "building", "build", "launch", "launching", "app",
    "product", "platform", "shipping", "side project",
    // Polish
    "projekt", "projekty", "projektów", "projektow", "aplikacj", "buduję",
    "buduje",
  ],
  pressure: [
    "pressure", "under pressure", "demands", "expectations", "weight on me",
    "on my shoulders",
    // Polish
    "presja", "presji", "presję", "presje",
  ],
  stress: [
    "stress", "stressed", "anxiety", "anxious", "tense", "on edge", "worried",
    // Polish
    "stres", "stresu", "zestresowany", "zestresowana", "spięt", "spiet",
  ],
  responsibility: [
    "responsibility", "responsibilities", "obligations", "duties",
    "everything on me", "all on me", "depends on me", "carrying",
    // Polish
    "odpowiedzialność", "odpowiedzialnosc", "obowiązki", "obowiazki",
  ],
  business: [
    "business", "company", "startup", "revenue", "clients", "customers",
    "sales", "market", "scale", "growth",
    // Polish
    "biznes", "biznesu", "firma", "klient", "sprzedaż", "sprzedaz",
  ],
  ambition: [
    "ambition", "ambitious", "driven", "succeed", "success", "make it",
    "go big", "global", "the best", "greatness",
    // Polish
    "ambicja", "ambicje", "sukces", "globalnie", "najlepszy",
  ],
  goals: [
    "goal", "dream", "want to", "plan", "planning", "future", "trying to",
    "aiming", "vision", "long term", "long-term",
    // Polish
    "cel", "cele", "marzenie", "marzę", "marze", "chcę", "chce", "przyszłość",
    "przyszlosc",
  ],
  relationships: [
    "wife", "husband", "partner", "friend", "family", "son", "daughter",
    "kids", "child", "relationship", "argument", "lonely", "alone",
    // Polish
    "żona", "zona", "mąż", "maz", "syn", "córka", "corka", "rodzina",
    "partnerka", "dziewczyna",
  ],
  health: [
    "tired", "exhausted", "sleep", "sick", "health", "rest", "burn out",
    // Polish
    "zmęczony", "zmeczony", "zmęczenie", "zmeczenie", "zdrowie", "sen",
  ],
  identity: [
    "who i am", "myself", "identity", "purpose", "meaning", "lost", "direction",
    // Polish
    "kim jestem", "sens", "tożsamość", "tozsamosc",
  ],
};

// Known project / life-work names. When any appears in the message OR a memory,
// we treat that text as work + projects related, regardless of language. This is
// what bridges Polish messages to English work memories (e.g. "INNER").
const PROJECT_NAMES: string[] = [
  "inner", "acai motion", "acai", "vet emergency", "vet", "clinic", "clinics",
  "youtube", "music", "muzyka",
];

// Theme adjacency — related themes count as "connected" when matching. If the
// message hits one theme and the memory hits an adjacent one, that still counts
// as a shared theme. This is purely rule-based (no AI / embeddings).
const THEME_ADJACENCY: Record<string, string[]> = {
  overload: ["work", "projects", "responsibility", "pressure", "stress"],
  stress: ["pressure", "work", "relationships", "overload"],
  pressure: ["stress", "work", "overload", "responsibility"],
  goals: ["projects", "business", "ambition", "work"],
  work: ["projects", "overload", "responsibility", "business"],
  projects: ["work", "business", "goals"],
  business: ["work", "projects", "ambition"],
  ambition: ["goals", "business", "projects"],
  responsibility: ["work", "overload", "pressure"],
};

// Themes that mark a message (or memory) as "work-related" for the floor rule.
const WORK_THEMES = new Set([
  "work", "projects", "overload", "pressure", "stress", "goals",
  "responsibility", "business", "ambition",
]);

function rawThemesIn(text: string): Set<string> {
  const lower = text.toLowerCase();
  const found = new Set<string>();
  for (const [theme, words] of Object.entries(THEMES)) {
    if (words.some((w) => lower.includes(w))) found.add(theme);
  }
  return found;
}

function projectNamesIn(text: string): string[] {
  const lower = text.toLowerCase();
  return PROJECT_NAMES.filter((p) => lower.includes(p));
}

// Effective themes = raw themes + project-name triggers (work/projects) +
// adjacency expansion. Used for matching so related topics connect.
function effectiveThemesIn(text: string): Set<string> {
  const raw = rawThemesIn(text);
  const eff = new Set<string>(raw);

  if (projectNamesIn(text).length > 0) {
    eff.add("work");
    eff.add("projects");
  }

  for (const t of [...eff]) {
    for (const adj of THEME_ADJACENCY[t] ?? []) eff.add(adj);
  }
  return eff;
}

// Memory categories/types that count as "active work / project / goal" — these
// get a relevance boost when the user is talking about work or overload.
const WORK_CATEGORIES = new Set([
  "project", "goal", "life_goal", "career", "business", "life_context",
]);

// ─── Relevance scoring ─────────────────────────────────────────────────────────

// Detailed breakdown of a relevance computation — used both by the public
// scorer (which just returns .score) and by the audit logger (which prints the
// full reasoning). Keeping one implementation guarantees the audit reflects the
// exact math used in production.
export type RelevanceBreakdown = {
  score: number;
  matchedKeywords: string[];   // tokens shared between message and memory
  messageThemes: string[];     // themes detected in the user message
  memoryThemes: string[];      // themes detected in the memory text
  sharedThemes: string[];      // themes present in BOTH
  workBoostApplied: boolean;   // active work/project/goal boost fired
  repeatBoostApplied: boolean; // repeated-theme boost fired
  coreFactBoostApplied: boolean;
  floorApplied: boolean;       // work↔work relevance floor (min 40) fired
};

function computeRelevance(
  memory: ImportanceMemory,
  ctx: RelevanceContext
): RelevanceBreakdown {
  const empty: RelevanceBreakdown = {
    score: 0,
    matchedKeywords: [],
    messageThemes: [],
    memoryThemes: [],
    sharedThemes: [],
    workBoostApplied: false,
    repeatBoostApplied: false,
    coreFactBoostApplied: false,
    floorApplied: false,
  };

  const message = (ctx.userMessage ?? "").toString();
  if (!message.trim()) return empty;

  const memText = getText(memory);
  if (!memText.trim()) return empty;

  const category = (memory.category ?? "").toLowerCase();
  const type = (memory.type ?? "").toLowerCase();

  let score = 0;

  // 1) Direct token overlap — the strongest "about the same thing" signal.
  const msgTokens = new Set(tokenize(message));
  const memTokens = tokenize(memText);
  const matchedKeywords: string[] = [];
  for (const t of memTokens) {
    if (msgTokens.has(t) && !matchedKeywords.includes(t)) matchedKeywords.push(t);
  }
  score += Math.min(matchedKeywords.length, 4) * 14; // up to +56

  // 2) Shared themes — relevance without exact wording. Uses *effective* themes
  //    (project-name triggers + adjacency) so related topics connect across
  //    languages (e.g. PL "przytłoczenie" overload ↔ EN "work" memory).
  const msgThemes = effectiveThemesIn(message);
  const memThemes = effectiveThemesIn(memText);
  const sharedThemes: string[] = [];
  for (const t of msgThemes) {
    if (memThemes.has(t)) sharedThemes.push(t);
  }
  score += Math.min(sharedThemes.length, 3) * 16; // up to +48

  // 3) Active work/project boost when the user is talking about work, overload
  //    or goals — exactly the spec example.
  const messageIsWorkRelated = [...msgThemes].some((t) => WORK_THEMES.has(t));
  const memoryIsWork =
    WORK_CATEGORIES.has(category) ||
    [...memThemes].some((t) => WORK_THEMES.has(t)) ||
    projectNamesIn(memText).length > 0;
  const workBoostApplied = messageIsWorkRelated && memoryIsWork;
  if (workBoostApplied) score += 22;

  // 4) Repeated theme — the user keeps coming back to this topic.
  const repeatBoostApplied = repeatOf(memory) > 1;
  if (repeatBoostApplied) score += 8;

  // Mild boost for core_fact stability when it also shares a theme, so an
  // important-and-relevant fact edges out a merely-relevant one.
  const coreFactBoostApplied = type === "core_fact" && sharedThemes.length > 0;
  if (coreFactBoostApplied) score += 4;

  // 5) Relevance floor — if the memory is strongly work-related AND the user's
  //    message is work-related, guarantee a minimum relevance of 40 so a
  //    relevant work memory can't lose to a high-importance but off-topic fact.
  const floorApplied = messageIsWorkRelated && memoryIsWork;
  if (floorApplied) score = Math.max(score, 40);

  return {
    score: clamp(Math.round(score), 0, 100),
    matchedKeywords,
    messageThemes: [...msgThemes],
    memoryThemes: [...memThemes],
    sharedThemes,
    workBoostApplied,
    repeatBoostApplied,
    coreFactBoostApplied,
    floorApplied,
  };
}

/**
 * RelevanceScore (0-100): how related this memory is to the current message.
 * Increases with:
 *  - direct token overlap with the user's message
 *  - shared themes (overload / work / goals / relationships / health / identity)
 *  - being an active project / work / goal memory when the user talks about work
 *  - being a repeated theme (the user keeps returning to it)
 */
export function calculateRelevanceScore(
  memory: ImportanceMemory,
  ctx: RelevanceContext
): number {
  return computeRelevance(memory, ctx).score;
}

/** Audit helper — full breakdown of how a memory's relevance was computed. */
export function explainRelevance(
  memory: ImportanceMemory,
  ctx: RelevanceContext
): RelevanceBreakdown {
  return computeRelevance(memory, ctx);
}

/** Audit helper — the tokens and themes detected in the user message. */
export function explainMessage(message: string): {
  tokens: string[];
  themes: string[];
  rawThemes: string[];
  projectNames: string[];
  workRelated: boolean;
} {
  const msg = message ?? "";
  const effective = effectiveThemesIn(msg);
  return {
    tokens: tokenize(msg),
    themes: [...effective],
    rawThemes: [...rawThemesIn(msg)],
    projectNames: projectNamesIn(msg),
    workRelated: [...effective].some((t) => WORK_THEMES.has(t)),
  };
}

// ─── Combined ranking ──────────────────────────────────────────────────────────

export type RankedMemory<T> = {
  memory: T;
  importance: number;
  relevance: number;
  finalScore: number;
};

/**
 * Rank memories by the blended score and return the top `limit`.
 *   FinalScore = (Importance * 0.5) + (Relevance * 0.5)
 *
 * Input records are never mutated. Logs an audit of the selection.
 */
export function getContextRankedMemories<T extends ImportanceMemory>(
  memories: T[],
  ctx: RelevanceContext,
  limit?: number
): T[] {
  const list = Array.isArray(memories) ? memories : [];

  const ranked: RankedMemory<T>[] = list.map((m) => {
    const importance = calculateMemoryImportance(m);
    const relevance = calculateRelevanceScore(m, ctx);
    const finalScore = Math.round(importance * 0.5 + relevance * 0.5);
    return { memory: m, importance, relevance, finalScore };
  });

  ranked.sort((a, b) => b.finalScore - a.finalScore);

  const limited =
    typeof limit === "number" && limit >= 0 ? ranked.slice(0, limit) : ranked;

  // --- Audit log -------------------------------------------------------------
  console.log("\n=== MEMORY RELEVANCE RANKING ===");
  console.log("User message:", (ctx.userMessage ?? "").slice(0, 80));
  console.log(
    "Selected Memories:",
    limited.map((r, i) => ({
      rank: i + 1,
      memory: getText(r.memory).slice(0, 60),
      importance: r.importance,
      relevance: r.relevance,
      finalScore: r.finalScore,
    }))
  );
  console.log("=== END RELEVANCE RANKING ===\n");

  return limited.map((r) => r.memory);
}
