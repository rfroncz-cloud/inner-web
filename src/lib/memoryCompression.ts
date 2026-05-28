import {
  filterMemoriesForPrompt,
  memoryQualityScore,
  type MemoryLike,
} from "@/lib/memoryCleanup";
import type {
  RelationshipPatternProfile,
  RelationshipPatternType,
} from "@/lib/relationshipPatterns";

// ---------------------------------------------------------------------------
// Memory Compression Engine v1
// ---------------------------------------------------------------------------
// Turns a large pile of memories + a relationship profile into a tiny, human,
// prompt-ready summary. Pure TypeScript: no AI calls, no embeddings, no vector
// search. The goal is to keep the system prompt short and cheap while still
// giving INNER enough context to feel like it remembers.

export type CompressedMemoryContext = {
  rememberedFacts: string[];
  emotionalSummary: string;
  relationshipSummary: string;
  timelineSummary: string;
  promptContext: string;
};

type CompressParams = {
  memories: MemoryLike[];
  relationshipProfile: RelationshipPatternProfile | null;
  maxFacts?: number;
  maxLines?: number;
};

const DEFAULT_MAX_FACTS = 5;
const DEFAULT_MAX_LINES = 8;

// Soft, human, non-clinical one-liners for each pattern. Never expose the raw
// keys — only these sentences ever reach the prompt.
const SOFT_PATTERN_LINES: Record<RelationshipPatternType, string> = {
  avoidance: "May need space when emotions feel intense.",
  pressure: "Seems sensitive to pressure or expectations.",
  loneliness: "May feel disconnected sometimes.",
  trust_issue: "May take time to fully trust.",
  emotional_withdrawal: "May pull back when things feel too heavy.",
  need_for_reassurance: "May need signs that closeness is safe.",
  fear_of_rejection: "May protect himself before feeling rejected.",
  conflict_sensitivity: "May hold back when tension rises.",
};

// Confidence floors. Anything weaker is treated as noise and dropped so we
// never pad the prompt with low-signal guesses.
const PATTERN_MIN_CONFIDENCE = 40;
const TENSION_MIN_CONFIDENCE = 25;
const EVOLUTION_MIN_CONFIDENCE = 25;

// Categories/types that read as stable facts (vs transient feelings).
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
]);

const FACT_TYPES = new Set([
  "identity",
  "core_fact",
  "life_goal",
  "important_story",
  "project_context",
  "life_context",
]);

function looksLikeFact(m: MemoryLike): boolean {
  if (m.category && FACT_CATEGORIES.has(m.category)) return true;
  if (m.type && FACT_TYPES.has(m.type)) return true;
  if (m.entityName) return true;
  // After normalizeMemory(), structured facts read as "Label: Value".
  if ((m.memory || "").includes(": ")) return true;
  return false;
}

function uniqueLines(lines: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of lines) {
    const key = line.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(line.trim());
  }
  return out;
}

export function compressMemoryContext(
  params: CompressParams
): CompressedMemoryContext {
  const {
    memories,
    relationshipProfile,
    maxFacts = DEFAULT_MAX_FACTS,
    maxLines = DEFAULT_MAX_LINES,
  } = params;

  // --- Facts ---------------------------------------------------------------
  // filterMemoriesForPrompt already drops low-quality/test/question/raw-key
  // memories, normalizes surface text ("User's dog is Rio." -> "Dog: Rio"),
  // deduplicates near-duplicates, and logs CLEANED_MEMORIES.
  const cleaned = filterMemoriesForPrompt(
    Array.isArray(memories) ? memories : []
  );

  const ranked = [...cleaned].sort(
    (a, b) => memoryQualityScore(b) - memoryQualityScore(a)
  );

  // Prefer stable facts; backfill with other high-quality memories if needed.
  const factLike = ranked.filter(looksLikeFact);
  const rest = ranked.filter((m) => !looksLikeFact(m));
  const rememberedFacts = uniqueLines(
    [...factLike, ...rest].map((m) => (m.memory || "").trim())
  ).slice(0, Math.max(0, maxFacts));

  // --- Relationship / emotional context -----------------------------------
  const patternLines: string[] = [];
  const tensionLines: string[] = [];
  const timelineLines: string[] = [];

  if (relationshipProfile) {
    const strongSignals = [...relationshipProfile.signals]
      .filter((s) => s.finalConfidence >= PATTERN_MIN_CONFIDENCE)
      .sort((a, b) => b.finalConfidence - a.finalConfidence);

    for (const signal of strongSignals) {
      const line = SOFT_PATTERN_LINES[signal.type];
      if (line) patternLines.push(line);
    }

    for (const tension of relationshipProfile.emotionalTensions) {
      if (tension.confidence >= TENSION_MIN_CONFIDENCE && tension.summary) {
        tensionLines.push(tension.summary.trim());
      }
    }

    for (const evo of relationshipProfile.relationshipEvolution) {
      if (
        evo.direction !== "stable" &&
        evo.confidence >= EVOLUTION_MIN_CONFIDENCE &&
        evo.summary
      ) {
        timelineLines.push(evo.summary.trim());
      }
    }
  }

  const relationshipLines = uniqueLines([
    ...patternLines.slice(0, 2),
    ...tensionLines.slice(0, 1),
  ]);

  const timelineSummaryLines = uniqueLines(timelineLines).slice(0, 1);

  // --- Field summaries -----------------------------------------------------
  const emotionalSummary =
    patternLines.length > 0
      ? uniqueLines(patternLines).slice(0, 2).join(" ")
      : "";

  const relationshipSummary = relationshipLines.join(" ");
  const timelineSummary = timelineSummaryLines.join(" ");

  // --- Prompt context (line-budgeted) --------------------------------------
  // maxLines bounds the total number of bullet lines across all sections so
  // the prompt stays short regardless of how much memory accumulates.
  let budget = Math.max(1, maxLines);

  const factBullets = rememberedFacts.slice(0, budget);
  budget -= factBullets.length;

  const relBullets = relationshipLines.slice(0, Math.max(0, budget));
  budget -= relBullets.length;

  const timeBullets = timelineSummaryLines.slice(0, Math.max(0, budget));

  const sections: string[] = [];

  if (factBullets.length > 0) {
    sections.push(
      ["User memory summary:", ...factBullets.map((f) => `- ${f}`)].join("\n")
    );
  }

  if (relBullets.length > 0) {
    sections.push(
      [
        "Emotional / relationship context:",
        ...relBullets.map((r) => `- ${r}`),
      ].join("\n")
    );
  }

  if (timeBullets.length > 0) {
    sections.push(
      ["Timeline:", ...timeBullets.map((t) => `- ${t}`)].join("\n")
    );
  }

  const promptContext =
    sections.length > 0
      ? `${sections.join("\n")}\nUse subtly. Do not mention memory unless relevant.`
      : "";

  return {
    rememberedFacts,
    emotionalSummary,
    relationshipSummary,
    timelineSummary,
    promptContext,
  };
}
