// ---------------------------------------------------------------------------
// INNER Personality Polish Layer v1
// ---------------------------------------------------------------------------
// Final pass over a reply (after responseRewriter) so INNER reads like a real,
// observant companion — not an assistant or therapist. Pure TypeScript, no AI
// calls. Deterministic: the same reply + context always polishes the same way,
// so behaviour stays predictable (variety comes from content, not randomness).
//
// Pipeline:  AI response -> responseRewriter -> polishInnerReply -> UI

import type { ConversationMode } from "@/lib/conversationMode";

type PolishParams = {
  response: string;
  conversationMode?: ConversationMode | string;
  emotionalIntensity?: number;
  relationshipDepth?: number;
  recentMessages?: string[];
  userMessage?: string;
};

// Ultra-short, low-content replies that feel robotic or dismissive. Only
// acceptable as a direct answer to a yes/no question.
const BANNED_SHORT_REPLIES = new Set([
  "huh",
  "huh?",
  "yeah",
  "yep",
  "maybe",
  "sure",
  "nope",
  "ok",
  "okay",
  "k",
  "that again",
  "right",
  "i see",
]);

// Short affirmations that ARE fine when the user asked a yes/no question.
const YESNO_AFFIRMATIONS = new Set([
  "yeah",
  "yep",
  "yes",
  "no",
  "nope",
  "maybe",
  "sure",
]);

// Meaningful fallbacks when a reply degenerates into nothing useful. Soft,
// observational, never clinical. Chosen deterministically (no randomness).
const MEANINGFUL_FALLBACKS = [
  "That sounds like it's been lingering.",
  "You've mentioned it more than once lately.",
  "There's something there you keep coming back to.",
  "It feels like that's been sitting with you.",
];

const MIN_WORDS_DEFAULT = 4;
const MIN_WORDS_MINIMAL = 5;

// Phrases that should never survive — clinical, GPT-like, or emotionally
// repetitive. Some get a warmer observational replacement; others are removed.
const PREFERRED_REPLACEMENTS: { re: RegExp; to: string }[] = [
  // Warmer, more human reframings.
  {
    re: /\bit seems like you(?:'re| are) (?:really )?overwhelmed\.?/gi,
    to: "There's a lot pulling at your attention lately.",
  },
  {
    re: /\bthat sounds (?:really )?difficult\.?/gi,
    to: "That has been sitting with you for a while.",
  },
  {
    re: /\bthat sounds (?:really )?hard\.?/gi,
    to: "That has been sitting with you for a while.",
  },
  // Pure removals — nothing of value is lost.
  { re: /\bI understand how you feel\.?/gi, to: "" },
  { re: /\bI understand\.?/gi, to: "" },
  { re: /\bI hear you\.?/gi, to: "" },
  { re: /\byou(?:'re| are) not alone\.?/gi, to: "" },
  { re: /\bthat tiredness again\.?/gi, to: "" },
  { re: /\bit seems like\b/gi, to: "" },
  { re: /\bit sounds like\b/gi, to: "" },
];

// Openers to strip from the very start if anything slipped past the rewriter.
const RESIDUAL_OPENERS = [
  "yeah.",
  "i understand.",
  "i hear you.",
  "that sounds difficult.",
  "that sounds hard.",
  "you're not alone.",
  "you are not alone.",
];

function cleanSpacing(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\s+([.!?,;:])/g, "$1")
    .replace(/([.!?])\1+/g, "$1")
    .trim();
}

function recapitalize(text: string): string {
  const t = text.replace(/^[\s,;:.!?-]+/, "").trim();
  if (!t) return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function splitSentences(text: string): string[] {
  const matches = text.match(/[^.!?]+[.!?]+|\S[^.!?]*$/g);
  return matches ? matches.map((s) => s.trim()).filter(Boolean) : [];
}

function stripResidualOpeners(text: string): string {
  let out = text.trim();
  let changed = true;
  while (changed) {
    changed = false;
    const lower = out.toLowerCase();
    for (const opener of RESIDUAL_OPENERS) {
      if (lower.startsWith(opener)) {
        out = recapitalize(out.slice(opener.length));
        changed = true;
        break;
      }
    }
  }
  return out;
}

function dedupeExact(sentences: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of sentences) {
    const key = s.toLowerCase().replace(/[^a-z0-9ąćęłńóśźż ]/gi, "").trim();
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    out.push(s);
  }
  return out;
}

// Per-mode sentence ceiling — keeps each stance in its natural register.
function sentenceCeiling(mode: string): number {
  switch (mode) {
    case "minimal":
      return 1;
    case "direct":
    case "light":
    case "supportive":
    case "observant":
      return 2;
    case "reflective":
      return 3; // thoughtful, but not poetic overload
    default:
      return 2;
  }
}

// Deterministic 0..1 value from the reply — drives subtle rhythm without
// Math.random, so identical inputs always behave identically.
function rhythmSeed(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h * 31 + text.charCodeAt(i)) % 1000;
  }
  return h / 1000;
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function normalizeForMatch(text: string): string {
  return text.trim().toLowerCase().replace(/[.!?]+$/g, "").trim();
}

// Detects an explicit yes/no question (EN + PL), e.g. "Are you ok?",
// "Did it help?", "Czy to pomogło?".
function isYesNoQuestion(message: string): boolean {
  const t = (message || "").trim().toLowerCase();
  if (!t.endsWith("?")) return false;
  return /^(do|does|did|are|is|was|were|can|could|will|would|should|have|has|had|am|right|ok)\b/.test(
    t
  ) || /^czy\b/.test(t);
}

// Any question (factual or otherwise) — short answers are reasonable here.
function isQuestion(message: string): boolean {
  const t = (message || "").trim().toLowerCase();
  if (t.endsWith("?")) return true;
  return /^(what|who|where|when|how|why|which|co|gdzie|kiedy|jak|dlaczego|który|która|ile)\b/.test(
    t
  );
}

function pickFallback(seed: number): string {
  const idx = Math.floor(seed * MEANINGFUL_FALLBACKS.length) % MEANINGFUL_FALLBACKS.length;
  return MEANINGFUL_FALLBACKS[idx];
}

export function polishInnerReply(params: PolishParams): string {
  const {
    response,
    conversationMode = "direct",
    emotionalIntensity = 0,
    userMessage = "",
  } = params;

  if (!response || !response.trim()) return response;

  const mode = String(conversationMode);

  // 1. Replace / remove clinical + GPT-like phrasing.
  let text = response;
  for (const { re, to } of PREFERRED_REPLACEMENTS) {
    text = text.replace(re, to);
  }
  text = cleanSpacing(text);
  text = stripResidualOpeners(text);
  text = recapitalize(text);

  // If everything was filler, fall back to the original (never return empty).
  if (!text) return response.trim();

  // 2. Sentence-level cleanup.
  let sentences = dedupeExact(splitSentences(text));
  if (sentences.length === 0) return response.trim();

  // 3. Mode register.
  const ceiling = sentenceCeiling(mode);
  if (sentences.length > ceiling) {
    sentences = sentences.slice(0, ceiling);
  }

  // 4. Reply rhythm — occasionally let a calm moment land as a single line.
  //    Only when intensity is low, we'd otherwise send two sentences, and the
  //    first sentence is still meaningful on its own. Never forces a
  //    reflection, never invents content.
  const seed = rhythmSeed(text);
  if (
    sentences.length === 2 &&
    emotionalIntensity < 30 &&
    (mode === "light" || mode === "direct" || mode === "minimal") &&
    seed < 0.4 &&
    wordCount(sentences[0]) >= MIN_WORDS_DEFAULT
  ) {
    sentences = [sentences[0]];
  }

  let polished = cleanSpacing(sentences.join(" "));
  if (!polished) return response.trim();

  // 5. Minimum quality gate — never ship an unnatural ultra-short reply.
  const minWords = mode === "minimal" ? MIN_WORDS_MINIMAL : MIN_WORDS_DEFAULT;
  const words = wordCount(polished);
  const normalized = normalizeForMatch(polished);
  const isBanned = BANNED_SHORT_REPLIES.has(normalized);
  const userAskedYesNo = isYesNoQuestion(userMessage);
  const userAskedAnything = isQuestion(userMessage);
  const isEmotional = emotionalIntensity >= 40;

  let action = "kept";

  if (isBanned) {
    // A banned short reply is only OK as an affirmation to a yes/no question.
    if (userAskedYesNo && YESNO_AFFIRMATIONS.has(normalized) && !isEmotional) {
      action = "kept_yesno_affirmation";
    } else {
      polished = pickFallback(seed);
      action = "replaced_banned_short";
    }
  } else if (words < minWords) {
    // Too short to be meaningful. Allow only as a short answer to a real
    // question (and never for emotional messages).
    if (userAskedAnything && !isEmotional) {
      action = "kept_short_question_answer";
    } else {
      polished = pickFallback(seed);
      action = "replaced_low_content";
    }
  }

  console.log("LANGUAGE_POLISH_DECISION", {
    action,
    words,
    minWords,
    mode,
    isEmotional,
    userAskedYesNo,
    userAskedAnything,
  });

  return polished || response.trim();
}
