// ---------------------------------------------------------------------------
// Memory Influence Balancer v1
// ---------------------------------------------------------------------------
// Controls HOW OFTEN memory/relationship patterns are surfaced in a reply.
// Memory should improve conversations, not dominate them — most of the time it
// stays invisible and INNER simply responds to the current message.
//
// Pure TypeScript, no AI calls. Deterministic per input (no Math.random) so the
// same message behaves consistently. The underlying memory system is untouched;
// this only gates what reaches the prompt and the final reply.

import type { ConversationMode } from "@/lib/conversationMode";

export type MemoryInfluenceLevel = "none" | "light" | "medium" | "deep";

type PatternLike = { finalConfidence?: number } | string;
type TensionLike = { confidence?: number } | string;

type DetermineParams = {
  userMessage: string;
  emotionalIntensity?: number;
  relationshipDepth?: number;
  conversationMode?: ConversationMode | string;
  currentPatterns?: PatternLike[];
  currentTensions?: TensionLike[];
};

// Phrases where the user explicitly references the past -> allow deep history.
const EXPLICIT_PAST_MARKERS = [
  "again",
  "still",
  "same problem",
  "same issue",
  "as always",
  "you remember",
  "like before",
  "every time",
  // Polish
  "znowu",
  "nadal",
  "ten sam problem",
  "jak zawsze",
  "pamiętasz",
  "za każdym razem",
];

const FACTUAL_STARTERS = [
  "what",
  "who",
  "where",
  "when",
  "how",
  "why",
  "which",
  "can you",
  "could you",
  "co",
  "gdzie",
  "kiedy",
  "jak",
  "dlaczego",
  "ile",
];

// Words/phrases that count as "surfacing memory or patterns" — blocked when
// influence is none.
const MEMORY_REFERENCE_WORDS = [
  "pressure",
  "loneliness",
  "lonely",
  "avoidance",
  "withdrawn",
  "withdrawal",
  "you always",
  "you tend to",
  "you keep",
  "you've mentioned",
  "you have mentioned",
  "you've described",
  "you have described",
  "as before",
  "like before",
  "more than once",
  "for a while now",
  "this pattern",
  "recurring",
  // Polish
  "presja",
  "samotność",
  "samotny",
  "unikanie",
  "zawsze",
  "wspominałeś",
  "wspominałaś",
];

function seedFrom(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h * 31 + text.charCodeAt(i)) % 100000;
  }
  return h / 100000;
}

function includesAny(text: string, list: string[]): boolean {
  return list.some((w) => text.includes(w));
}

function startsWithAny(text: string, list: string[]): boolean {
  return list.some((w) => text.startsWith(w));
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function patternsAreStrong(patterns: PatternLike[]): boolean {
  if (!patterns || patterns.length === 0) return false;
  const strong = patterns.some((p) =>
    typeof p === "object" && p
      ? (p.finalConfidence ?? 0) >= 50
      : false
  );
  return strong || patterns.length >= 2;
}

function tensionsActive(tensions: TensionLike[]): boolean {
  if (!tensions || tensions.length === 0) return false;
  return tensions.some((t) =>
    typeof t === "object" && t ? (t.confidence ?? 0) >= 20 : true
  );
}

// Default probability buckets: 60% none, 25% light, 10% medium, 5% deep.
function defaultBucket(seed: number): MemoryInfluenceLevel {
  if (seed < 0.6) return "none";
  if (seed < 0.85) return "light";
  if (seed < 0.95) return "medium";
  return "deep";
}

export function determineMemoryInfluence(
  params: DetermineParams
): MemoryInfluenceLevel {
  const {
    userMessage,
    emotionalIntensity = 0,
    conversationMode = "direct",
    currentPatterns = [],
    currentTensions = [],
  } = params;

  const text = (userMessage || "").trim().toLowerCase();
  const mode = String(conversationMode);
  const isQuestion = text.endsWith("?");
  const words = wordCount(text);

  // 1. Explicit reference to the past -> deep history is welcome.
  if (includesAny(text, EXPLICIT_PAST_MARKERS)) {
    return "deep";
  }

  // 2. Factual / short / practical / first-mention -> stay invisible.
  const factual =
    startsWithAny(text, FACTUAL_STARTERS) ||
    (isQuestion && emotionalIntensity < 35) ||
    mode === "direct" ||
    mode === "minimal";
  if ((factual || words <= 3) && emotionalIntensity < 40) {
    return "none";
  }

  // 3. Strong patterns / active tension -> one grounded reference allowed.
  if (patternsAreStrong(currentPatterns) || tensionsActive(currentTensions)) {
    return "medium";
  }

  // 4. Mild emotional discussion -> subtle only.
  if (emotionalIntensity >= 25 && emotionalIntensity < 45) {
    return "light";
  }

  // 5. Otherwise fall back to the default distribution.
  return defaultBucket(seedFrom(text || "x"));
}

/** True when memory may be surfaced at all for this level. */
export function shouldReferenceMemory(level: MemoryInfluenceLevel): boolean {
  return level !== "none";
}

/** True when relationship-pattern context may be injected for this level. */
export function shouldReferenceRelationship(
  level: MemoryInfluenceLevel
): boolean {
  return level === "medium" || level === "deep";
}

/**
 * Enforces a "none" influence on a finished reply by removing sentences that
 * surface memory/patterns. Falls back to the original text if filtering would
 * empty it (we never ship a blank reply).
 */
export function enforceMemoryInfluence(
  reply: string,
  level: MemoryInfluenceLevel
): string {
  if (level !== "none" || !reply || !reply.trim()) return reply;

  const sentences =
    reply.match(/[^.!?]+[.!?]+|\S[^.!?]*$/g)?.map((s) => s.trim()) ?? [reply];

  const kept = sentences.filter(
    (s) => !includesAny(s.toLowerCase(), MEMORY_REFERENCE_WORDS)
  );

  if (kept.length === 0) {
    // The whole reply leaned on memory. Keep the first sentence rather than
    // returning empty — but stripped of nothing else to add.
    return reply.trim();
  }

  const out = kept.join(" ").replace(/\s+/g, " ").trim();
  return out || reply.trim();
}
