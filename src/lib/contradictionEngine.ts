// ---------------------------------------------------------------------------
// Contradiction Engine v2 — Factual Memory Contradiction Detector
// ---------------------------------------------------------------------------
// Checks a new memory candidate against existing stored memories.
// Deterministic rules only. No AI calls.
// Does NOT block saving — only flags conflicts for future resolution.

export type MemoryContradictionResult = {
  hasConflict: boolean;
  conflictingMemoryIds: string[];
  reason: string;
};

type ContradictionRule = {
  // Detects whether an existing memory asserts this fact
  existingRe: RegExp;
  // Phrases in the new memory text that deny/negate this fact
  denyPhrases: string[];
  // Polish equivalents of deny phrases
  denyPhrasespl: string[];
  // Human-readable reason template (receives the captured existing value)
  reason: (existingValue: string) => string;
};

const MEMORY_CONTRADICTION_RULES: ContradictionRule[] = [
  // ── Spouse ──────────────────────────────────────────────────────────────────
  {
    existingRe: /user'?s?\s+wife\s+is\s+(?:named\s+)?([^\s.,]+)/i,
    denyPhrases: [
      "not married", "i'm single", "i am single", "no wife", "don't have a wife",
      "never been married", "never married", "i'm not married", "i am not married",
    ],
    denyPhrasespl: [
      "nie jestem żonaty", "nie jestem zamężna", "nie mam żony", "jestem singlem",
      "nigdy nie byłem żonaty",
    ],
    reason: (v) => `Existing memory says wife is ${v}, but new message says not married.`,
  },
  {
    existingRe: /user'?s?\s+husband\s+is\s+(?:named\s+)?([^\s.,]+)/i,
    denyPhrases: [
      "not married", "i'm single", "i am single", "no husband", "don't have a husband",
      "never been married", "never married", "i'm not married", "i am not married",
    ],
    denyPhrasespl: [
      "nie mam męża", "jestem singlem", "nie jestem zamężna",
    ],
    reason: (v) => `Existing memory says husband is ${v}, but new message says not married.`,
  },

  // ── Children ────────────────────────────────────────────────────────────────
  {
    existingRe: /user'?s?\s+son\s+is\s+(?:named\s+)?([^\s.,]+)/i,
    denyPhrases: [
      "no children", "no kids", "don't have kids", "i have no children",
      "childless", "never had children", "i don't have a son", "no son",
    ],
    denyPhrasespl: [
      "nie mam dzieci", "nie mam syna", "jestem bezdzietny",
    ],
    reason: (v) => `Existing memory says son is ${v}, but new message says no children.`,
  },
  {
    existingRe: /user'?s?\s+daughter\s+is\s+(?:named\s+)?([^\s.,]+)/i,
    denyPhrases: [
      "no children", "no kids", "don't have kids", "i have no children",
      "childless", "never had children", "i don't have a daughter", "no daughter",
    ],
    denyPhrasespl: [
      "nie mam dzieci", "nie mam córki", "jestem bezdzietny",
    ],
    reason: (v) => `Existing memory says daughter is ${v}, but new message says no children.`,
  },

  // ── Pets ────────────────────────────────────────────────────────────────────
  {
    existingRe: /user'?s?\s+dog\s+is\s+(?:named\s+)?([^\s.,]+)/i,
    denyPhrases: [
      "no dog", "never had a dog", "don't have a dog", "i have no dog",
      "i never had a dog", "not a dog owner",
    ],
    denyPhrasespl: [
      "nie mam psa", "nigdy nie miałem psa",
    ],
    reason: (v) => `Existing memory says dog is ${v}, but new message says no dog.`,
  },
  {
    existingRe: /user'?s?\s+cat\s+is\s+(?:named\s+)?([^\s.,]+)/i,
    denyPhrases: [
      "no cat", "never had a cat", "don't have a cat", "i have no cat",
      "i never had a cat",
    ],
    denyPhrasespl: [
      "nie mam kota", "nigdy nie miałem kota",
    ],
    reason: (v) => `Existing memory says cat is ${v}, but new message says no cat.`,
  },

  // ── Identity / location ──────────────────────────────────────────────────────
  {
    existingRe: /user\s+lives\s+in\s+([^.,]+)/i,
    denyPhrases: [
      "i don't live", "i no longer live", "moved out of", "i moved away from",
      "not living in",
    ],
    denyPhrasespl: [
      "nie mieszkam w", "wyprowadziłem się",
    ],
    reason: (v) => `Existing memory says you live in ${v}, but new message contradicts that.`,
  },
];

// Check whether the new memory text contains any deny phrase for a rule.
function denyMatch(newLower: string, rule: ContradictionRule): boolean {
  return (
    rule.denyPhrases.some((p) => newLower.includes(p)) ||
    rule.denyPhrasespl.some((p) => newLower.includes(p))
  );
}

export function detectMemoryContradiction(
  newMemoryText: string,
  existingMemories: { id?: string; memory?: string; category?: string }[]
): MemoryContradictionResult {
  const newLower = (newMemoryText || "").toLowerCase();
  const conflictingIds: string[] = [];
  const reasons: string[] = [];

  for (const existing of existingMemories) {
    const existingText = (existing.memory || "").trim();
    if (!existingText) continue;

    for (const rule of MEMORY_CONTRADICTION_RULES) {
      const m = existingText.match(rule.existingRe);
      if (!m?.[1]) continue;

      const capturedValue = m[1].replace(/[.,!?]+$/, "").trim();
      if (!capturedValue || capturedValue.length < 2) continue;

      if (denyMatch(newLower, rule)) {
        if (existing.id) conflictingIds.push(existing.id);
        reasons.push(rule.reason(capturedValue));
        break; // one conflict per existing memory is enough
      }
    }
  }

  const hasConflict = conflictingIds.length > 0;

  return {
    hasConflict,
    conflictingMemoryIds: conflictingIds,
    reason: reasons.join(" | "),
  };
}

// ---------------------------------------------------------------------------
// Contradiction Engine v1 — Emotional/Behavioral Contradictions (unchanged)
// ---------------------------------------------------------------------------

export function detectContradiction(
    memories: { memory?: string }[],
    userMessage: string
  ) {
    const combined = memories
      .slice(0, 40)
      .map((m) => (m.memory || "").toLowerCase())
      .join(" ");
  
    const text = userMessage.toLowerCase();
  
    // ambition vs exhaustion
    const ambition =
      combined.includes("success") ||
      combined.includes("future") ||
      combined.includes("build") ||
      combined.includes("ambition");
  
    const exhaustion =
      combined.includes("tired") ||
      combined.includes("exhausted") ||
      combined.includes("drained");
  
    if (
      ambition &&
      exhaustion &&
      (
        text.includes("can't") ||
        text.includes("stuck") ||
        text.includes("avoid") ||
        text.includes("tired")
      )
    ) {
      return "ambition_exhaustion";
    }
  
    // connection vs distance
    const relationships =
      combined.includes("wife") ||
      combined.includes("family") ||
      combined.includes("love");
  
    const loneliness =
      combined.includes("lonely") ||
      combined.includes("disconnected");
  
    if (
      relationships &&
      loneliness &&
      (
        text.includes("alone") ||
        text.includes("empty") ||
        text.includes("disconnected")
      )
    ) {
      return "connection_distance";
    }
  
    // identity contradiction
    const identity =
      combined.includes("who i am") ||
      combined.includes("becoming") ||
      combined.includes("lost");
  
    if (
      identity &&
      (
        text.includes("don't know") ||
        text.includes("lost") ||
        text.includes("confused")
      )
    ) {
      return "identity_conflict";
    }
  
    return null;
  }
  
  export function getContradictionInstruction(
    contradiction: string | null
  ) {
    if (!contradiction) return "";
  
    switch (contradiction) {
      case "ambition_exhaustion":
        return `
  INNER CONTRADICTION:
  
  The user simultaneously carries ambition and exhaustion.
  
  You may subtly notice:
  - pushing hard while feeling drained
  - wanting growth while emotionally overloaded
  
  Do not sound clinical.
  Do not over-analyze.
  `.trim();
  
      case "connection_distance":
        return `
  INNER CONTRADICTION:
  
  The user has people around them, yet still feels emotionally distant.
  
  Notice the emotional tension quietly.
  Do not over-comfort.
  `.trim();
  
      case "identity_conflict":
        return `
  INNER CONTRADICTION:
  
  The user seems disconnected from who they expected themselves to become.
  
  Respond with subtle emotional observation.
  Avoid therapy language.
  `.trim();
  
      default:
        return "";
    }
  }