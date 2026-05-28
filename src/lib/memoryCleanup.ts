import { shouldDecayMemory } from "@/lib/memoryDecay";
export type MemoryLike = {
  memory?: string;
  type?: string;
  category?: string;
  importance?: number;
  emotionalWeight?: number;
  repeatCount?: number;
  emotionalIntensity?: number;
  emotionalLayer?: string;
  entityName?: string;
  createdAt?: string;
  created_at?: string;
};

const protectedTypes = ["core_fact"];

const protectedCategories = [
  "identity",
  "family",
  "pet",
  "home",
  "birth",
  "childhood",
  "vehicle",
  "work",
  "health",
  "finance",
  "values",
];

const trashPatterns = [
  "http://",
  "https://",
  "localhost:",
  "deep analysis on this",
  "go deeper on this",
  "analyze this",
  "test",
  "xd",
  "lol",
  "haha",
  "jaka dziś jest data",
  "jaka dzis jest data",
  "która godzina",
  "ktora godzina",
  "what time is it",
  "what is today",
  "what date is it",
  "siema",
  "cześć",
  "czesc",
  "hello",
  "hej",
  "ok",
  "okej",
];

const questionPatterns = [
  "?",
  "jak mam na imię",
  "jak mam na imie",
  "what is my name",
  "who is my wife",
  "what is my wife",
  "what is my son's name",
  "what is my dog's name",
  "where do i live",
];

export function shouldDeleteMemory(memory: MemoryLike): boolean {
  const text = (memory.memory || "").toLowerCase().trim();
  const category = memory.category || "";
  const type = memory.type || "";
  const importance = memory.importance || 0;

  if (!text) return true;

  if (protectedTypes.includes(type)) return false;
  if (protectedCategories.includes(category)) return false;
  if (importance >= 80) return false;

  if (text.length < 8) return true;
  if (text.length > 600) return true;

  if (trashPatterns.some((pattern) => text.includes(pattern))) {
    return true;
  }

  if (questionPatterns.some((pattern) => text.includes(pattern))) {
    return true;
  }

  if (
    text.includes("function ") ||
    text.includes("const ") ||
    text.includes("import ") ||
    text.includes("export ") ||
    text.includes("=>") ||
    text.includes("error:") ||
    text.includes("syntaxerror")
  ) {
    return true;
  }
  if (shouldDecayMemory(memory)) {
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Memory Cleanup & Quality Engine
// ---------------------------------------------------------------------------
// Everything below is local-only, no AI calls, no embeddings. The goal is to
// keep noisy, repetitive, low-quality, or test memories out of the reflection
// UI while leaving the underlying chat memory flow untouched.

// Raw internal labels the user must never see in the panel.
const RAW_PATTERN_KEYS = new Set([
  "avoidance",
  "loneliness",
  "pressure",
  "fear_of_rejection",
  "trust_issue",
  "conflict_sensitivity",
  "emotional_withdrawal",
  "need_for_reassurance",
]);

// Standalone emotional words that on their own carry no useful information.
const BARE_EMOTION_WORDS = new Set([
  "fear",
  "sadness",
  "anger",
  "hope",
  "love",
  "identity",
  "neutral",
  "pressure",
  "loneliness",
  "avoidance",
  "rejection",
  "withdrawal",
  "reassurance",
]);

// Filler / test / debug phrases that should never become long-term insights.
const FILLER_PHRASES = new Set([
  "ok",
  "okay",
  "okej",
  "hello",
  "hi",
  "hey",
  "yo",
  "siema",
  "cześć",
  "czesc",
  "test",
  "testing",
  "debug",
  "lol",
  "haha",
  "xd",
  "yes",
  "no",
  "tak",
  "nie",
]);

// Types whose contents are signals/labels rather than user-facing memories.
const NON_REFLECTION_TYPES = new Set([
  "relationship_pattern",
  "sleep_pattern",
]);

function normalizedKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.!,;:?"'`]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Returns true when a memory is too noisy/low-signal to ever be useful.
 * Accepts either a raw memory string or a MemoryLike object so it can be used
 * both at the text level and the record level. Intentionally strict — anything
 * ambiguous is kept and let through to the quality-score gate downstream.
 */
export function isLowQualityMemory(memory: MemoryLike | string): boolean {
  const raw = (typeof memory === "string" ? memory : memory.memory || "").trim();
  if (!raw) return true;

  const lower = raw.toLowerCase();
  const stripped = normalizedKey(raw);

  // Very short / under 8 characters carry too little to be useful.
  if (raw.length < 8) return true;
  if (stripped.length < 6) return true;
  if (raw.length < 12) return true;
  if (raw.endsWith("?")) return true;

  // Single-word memories (one-word labels) carry too little context.
  if (!stripped.includes(" ")) return true;

  // The whole memory is a raw internal pattern key.
  if (RAW_PATTERN_KEYS.has(stripped)) return true;

  // The whole memory is a bare emotion word.
  if (BARE_EMOTION_WORDS.has(stripped)) return true;

  // Test / debug / filler.
  if (FILLER_PHRASES.has(stripped)) return true;

  // Repeat the chat-side trash check so the reflection panel never lags
  // behind cleanups.
  for (const pattern of [
    "http://",
    "https://",
    "localhost:",
    "deep analysis on this",
    "go deeper on this",
    "analyze this",
    "function ",
    "const ",
    "=>",
    "syntaxerror",
  ]) {
    if (lower.includes(pattern)) return true;
  }

  // Common question phrasings that slipped past raw `?` filtering.
  for (const q of [
    "what is my",
    "what's my",
    "who is my",
    "where do i live",
    "what is today",
    "what time is it",
    "jak mam na imię",
    "jak mam na imie",
  ]) {
    if (lower.includes(q)) return true;
  }

  return false;
}

type PrettifyRule = { re: RegExp; label: string };

const PRETTIFY_RULES: PrettifyRule[] = [
  { re: /user'?s?\s+name\s+is\s+(?:named\s+)?([^.]+)\.?$/i, label: "Name" },
  { re: /user'?s?\s+wife\s+is\s+(?:named\s+)?([^.]+)\.?$/i, label: "Wife" },
  { re: /user'?s?\s+husband\s+is\s+(?:named\s+)?([^.]+)\.?$/i, label: "Husband" },
  { re: /user'?s?\s+partner\s+is\s+(?:named\s+)?([^.]+)\.?$/i, label: "Partner" },
  { re: /user'?s?\s+son\s+is\s+(?:named\s+)?([^.]+)\.?$/i, label: "Son" },
  { re: /user'?s?\s+daughter\s+is\s+(?:named\s+)?([^.]+)\.?$/i, label: "Daughter" },
  { re: /user'?s?\s+dog\s+is\s+(?:named\s+)?([^.]+)\.?$/i, label: "Dog" },
  { re: /user'?s?\s+cat\s+is\s+(?:named\s+)?([^.]+)\.?$/i, label: "Cat" },
  { re: /user has\s+(\d+)\s+cats?\.?$/i, label: "Cats" },
  { re: /user has\s+(\d+)\s+dogs?\.?$/i, label: "Dogs" },
  { re: /user'?s?\s+birthday\s+is\s+([^.]+)\.?$/i, label: "Birthday" },
  { re: /user lives in\s+([^.]+)\.?$/i, label: "Location" },
];

/**
 * Rewrites a raw memory sentence into a clean, human-friendly label.
 *   "User's dog is Rio."        -> "Dog: Rio"
 *   "User has 3 cats."          -> "Cats: 3"
 *   "User lives in Inowroclaw." -> "Location: Inowroclaw"
 * Pure string -> string. Safe to call repeatedly (idempotent on labels).
 */
export function normalizeMemoryText(memoryText: string): string {
  const trimmed = (memoryText || "").trim().replace(/\s+/g, " ");
  if (!trimmed) return "";

  for (const rule of PRETTIFY_RULES) {
    const m = trimmed.match(rule.re);
    if (m?.[1]) {
      return `${rule.label}: ${m[1].trim()}`;
    }
  }

  // For longer narrative memories, strip the "User " prefix so it reads less
  // like a database row and capitalize the first letter.
  const cleaned = trimmed.replace(/^user'?s?\s*/i, "").trim();
  if (cleaned.length === 0) return trimmed;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function prettifyText(raw: string): string {
  return normalizeMemoryText(raw);
}

/**
 * Returns the same memory with `.memory` rewritten in a human-friendly form.
 * Pure — does not mutate the input. Safe to call repeatedly.
 */
export function normalizeMemory(memory: MemoryLike): MemoryLike {
  const raw = (memory.memory || "").trim();
  if (!raw) return memory;
  return { ...memory, memory: prettifyText(raw) };
}

/**
 * Memory quality score 0-100. Memories below `MEMORY_QUALITY_THRESHOLD` are
 * considered too weak to show in the reflection panel.
 */
export function memoryQualityScore(memory: MemoryLike): number {
  const text = (memory.memory || "").trim();
  if (!text) return 0;

  const importance = memory.importance ?? 1;
  const weight = memory.emotionalWeight ?? 1;
  const repeat = memory.repeatCount ?? 1;
  const intensity = memory.emotionalIntensity ?? 0;

  let score = importance * 6 + weight * 5 + repeat * 4 + intensity * 1.5;

  if (memory.entityName) score += 12;

  const category = memory.category || "";
  if (
    category === "core_fact" ||
    category === "identity" ||
    category === "family" ||
    category === "relationship" ||
    category === "pet"
  ) {
    score += 10;
  }

  // Slight penalty for very short normalized text — keeps stubs out.
  if (text.length < 24) score -= 8;
  if (text.length < 16) score -= 12;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export const MEMORY_QUALITY_THRESHOLD = 35;

/**
 * Merge near-duplicate memories. Two memories collapse into one when their
 * normalized text matches exactly OR when one fully contains the other.
 * Importance, emotional weight, and repeat count are summed (clamped) so the
 * merged memory keeps the strongest signal.
 */
export function deduplicateMemories<T extends MemoryLike>(memories: T[]): T[] {
  const out: T[] = [];
  const byKey = new Map<string, number>();

  for (const m of memories) {
    const text = (m.memory || "").trim();
    if (!text) continue;

    const key = normalizedKey(text);
    if (!key) continue;

    if (byKey.has(key)) {
      const idx = byKey.get(key)!;
      out[idx] = mergeMemoryPair(out[idx], m);
      continue;
    }

    // Substring-based collapse: e.g. "User lives in Inowroclaw" vs
    // "User lives in Inowroclaw." or longer rewordings.
    let merged = false;
    for (const [existingKey, idx] of byKey) {
      if (existingKey.length > 12 && key.length > 12) {
        if (
          existingKey.includes(key) ||
          key.includes(existingKey)
        ) {
          out[idx] = mergeMemoryPair(out[idx], m);
          merged = true;
          break;
        }
      }
    }
    if (merged) continue;

    byKey.set(key, out.length);
    out.push(m);
  }

  return out;
}

function mergeMemoryPair<T extends MemoryLike>(a: T, b: T): T {
  const importance = Math.min(
    100,
    (a.importance ?? 0) + (b.importance ?? 0)
  );
  const emotionalWeight = Math.min(
    100,
    (a.emotionalWeight ?? 0) + (b.emotionalWeight ?? 0)
  );
  const repeatCount = (a.repeatCount ?? 1) + (b.repeatCount ?? 1);

  // Keep the longer / richer text variant.
  const aText = (a.memory || "").trim();
  const bText = (b.memory || "").trim();
  const memory = bText.length > aText.length ? bText : aText;

  return {
    ...a,
    ...b,
    memory,
    importance,
    emotionalWeight,
    repeatCount,
  };
}

/**
 * Pipeline used by the reflection panel: drops low-quality items, normalizes
 * surface text, deduplicates near-duplicates, and applies the quality
 * threshold. Pure — never mutates inputs.
 */
export function filterReflectionMemories<T extends MemoryLike>(
  memories: T[]
): T[] {
  if (!Array.isArray(memories) || memories.length === 0) return [];

  const cleaned: T[] = [];
  for (const m of memories) {
    if (!m || !m.memory) continue;
    if (m.type && NON_REFLECTION_TYPES.has(m.type)) continue;
    if (isLowQualityMemory(m)) continue;

    const normalized = normalizeMemory(m) as T;
    if (memoryQualityScore(normalized) < MEMORY_QUALITY_THRESHOLD) continue;

    cleaned.push(normalized);
  }

  return deduplicateMemories(cleaned);
}

// --- Memory Quality Cleanup v1 public API ---------------------------------
// Thin, explicit entry points used by the Memory Panel, the Memory Compression
// Engine, and the prompt memory context. They share the same core pipeline so
// behavior stays consistent everywhere. NOTE: nothing here deletes database
// records — bad memories are only filtered/hidden from the UI and the prompt.

/** Alias kept for the v1 spec naming. Merges near-duplicate memories. */
export function deduplicateMemoryList<T extends MemoryLike>(
  memories: T[]
): T[] {
  return deduplicateMemories(memories);
}

/**
 * Clean set of memories safe to inject into the prompt context. Drops
 * low-quality / test / question / raw-label memories, normalizes surface text,
 * applies the quality threshold, and removes duplicates.
 */
export function filterMemoriesForPrompt<T extends MemoryLike>(
  memories: T[]
): T[] {
  const cleanedMemories = filterReflectionMemories(memories);
  console.log("CLEANED_MEMORIES", cleanedMemories);
  return cleanedMemories;
}

/**
 * Clean set of memories safe to show in the Memory Panel. Same pipeline as the
 * prompt path so the UI and the prompt never disagree about what INNER knows.
 */
export function filterMemoriesForPanel<T extends MemoryLike>(
  memories: T[]
): T[] {
  return filterReflectionMemories(memories);
}