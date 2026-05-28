// ---------------------------------------------------------------------------
// Human Realism Engine v1
// ---------------------------------------------------------------------------
// Adds subtle, human variation to INNER's final reply so it feels less
// patterned (less "that feeling..." on repeat). Runs AFTER personalityPolish.
// Pure TypeScript, no AI calls. Deterministic per input so behaviour is stable.
//
// Pipeline:
//   AI response -> responseRewriter -> personalityPolish -> humanRealism -> UI

import type { ConversationMode } from "@/lib/conversationMode";

export type HumanRealismStyle =
  | "quiet_observation"
  | "gentle_question"
  | "direct_truth"
  | "small_humor"
  | "warm_presence"
  | "minimal_acknowledgment";

type ChooseParams = {
  userMessage: string;
  conversationMode?: ConversationMode | string;
  emotionalIntensity?: number;
  recentAssistantMessages?: string[];
  relationshipDepth?: number;
  reflectionDecision?: boolean;
};

type ApplyParams = {
  response: string;
  style: HumanRealismStyle;
  userMessage?: string;
  conversationMode?: ConversationMode | string;
  emotionalIntensity?: number;
  recentAssistantMessages?: string[];
};

// Soft, open questions used (occasionally) for the gentle_question style.
const GENTLE_QUESTIONS = [
  "What's been the heaviest part?",
  "Is it one thing, or everything at once?",
  "What's underneath it?",
  "How long has it been like this?",
  "What's been pulling at you most?",
];

// Overused / stale phrasings -> quieter equivalents (or removal).
const STALE_PHRASES: { re: RegExp; to: string }[] = [
  { re: /\bthat feeling again\b/gi, to: "that" },
  { re: /\bthat feeling\b/gi, to: "that" },
  { re: /\bI can feel that\b/gi, to: "" },
  { re: /\bI can sense that\b/gi, to: "" },
  { re: /\bthere's that weight\b/gi, to: "there's a weight" },
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

function seedFrom(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h * 31 + text.charCodeAt(i)) % 100000;
  }
  return h / 100000;
}

function startsWithAny(text: string, list: string[]): boolean {
  return list.some((w) => text.startsWith(w));
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function cleanSpacing(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\s+([.!?,;:])/g, "$1")
    .trim();
}

// Infer the previous style from the last assistant message so we can avoid
// repeating the exact same shape twice in a row.
function inferLastStyle(recent: string[]): HumanRealismStyle | null {
  const last = (recent[recent.length - 1] || "").trim();
  if (!last) return null;
  if (last.endsWith("?")) return "gentle_question";
  if (wordCount(last) <= 4) return "minimal_acknowledgment";
  return null;
}

export function chooseHumanRealismStyle(
  params: ChooseParams
): HumanRealismStyle {
  const {
    userMessage,
    emotionalIntensity = 0,
    recentAssistantMessages = [],
  } = params;

  const text = (userMessage || "").trim().toLowerCase();
  const isQuestion = text.endsWith("?");
  const factual =
    startsWithAny(text, FACTUAL_STARTERS) ||
    (isQuestion && emotionalIntensity < 35);

  const seed = seedFrom(text || "x");
  const lastStyle = inferLastStyle(recentAssistantMessages);

  // 1. Practical / factual -> just be true and clear.
  if (factual && emotionalIntensity < 40) {
    return "direct_truth";
  }

  // 2. Emotional -> rotate among observation / question / presence.
  if (emotionalIntensity >= 40) {
    const pool: HumanRealismStyle[] = [
      "quiet_observation",
      "gentle_question",
      "warm_presence",
    ];
    let idx = Math.floor(seed * pool.length) % pool.length;
    // Avoid repeating the same style as the previous turn when possible.
    if (pool[idx] === lastStyle) idx = (idx + 1) % pool.length;
    return pool[idx];
  }

  // 3. Low-intensity casual -> light touch.
  if (emotionalIntensity < 25) {
    const pool: HumanRealismStyle[] = [
      "small_humor",
      "minimal_acknowledgment",
    ];
    let idx = Math.floor(seed * pool.length) % pool.length;
    if (pool[idx] === lastStyle) idx = (idx + 1) % pool.length;
    return pool[idx];
  }

  // 4. Default middle ground.
  return "quiet_observation";
}

function applyStalePhrases(text: string): string {
  let out = text;
  for (const { re, to } of STALE_PHRASES) {
    out = out.replace(re, to);
  }
  return cleanSpacing(out);
}

export function applyHumanRealism(params: ApplyParams): string {
  const {
    response,
    style,
    emotionalIntensity = 0,
  } = params;

  if (!response || !response.trim()) return response;

  // 1. Always soften stale, repetitive phrasing — this is the subtle baseline.
  let text = applyStalePhrases(response);
  if (!text) return response.trim();

  const hasQuestion = text.includes("?");
  const words = wordCount(text);
  const seed = seedFrom(text);

  // 2. Style-specific light touch. Deliberately conservative: most styles make
  //    no structural change at all, so realism stays subtle.
  if (
    style === "gentle_question" &&
    !hasQuestion &&
    emotionalIntensity >= 40 &&
    words >= 3 &&
    words <= 14 &&
    seed < 0.55 // only sometimes, so it doesn't become a new pattern
  ) {
    const q = GENTLE_QUESTIONS[Math.floor(seed * GENTLE_QUESTIONS.length) % GENTLE_QUESTIONS.length];
    text = `${text.replace(/[.\s]+$/, ".")} ${q}`;
  }

  const final = cleanSpacing(text);
  return final || response.trim();
}
