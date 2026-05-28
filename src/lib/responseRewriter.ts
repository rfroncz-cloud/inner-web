// ---------------------------------------------------------------------------
// Natural Response Rewriter v1
// ---------------------------------------------------------------------------
// Post-processes INNER's raw reply so it sounds human and quietly observant
// rather than therapeutic, generic, or AI-flavored. Pure TypeScript: no AI
// calls. Deterministic (no Math.random) so the same reply always rewrites the
// same way — variety comes from the actual content and conversation context,
// not from coin flips.

import type { ConversationMode } from "@/lib/conversationMode";

type RewriteParams = {
  rawResponse: string;
  conversationMode?: ConversationMode | string;
  emotionalIntensity?: number;
  recentAssistantMessages?: string[];
  relationshipReflectionDecision?: boolean;
};

// Generic GPT/therapy openers to strip from the START of a reply.
const BANNED_OPENERS = [
  "that sounds tough.",
  "that sounds difficult.",
  "that sounds hard.",
  "that sounds heavy.",
  "that seems heavy.",
  "that seems hard.",
  "i understand how you feel.",
  "i understand how painful that must be.",
  "i understand.",
  "i hear you.",
  "i'm here to listen.",
  "i'm here for you.",
  "it can be tough",
  "it might help",
  "you are not alone.",
  "you're not alone.",
];

// Mid-text generic phrases -> quieter, more observational replacements (or
// removal). Order matters; longer phrases first.
const PHRASE_REPLACEMENTS: { re: RegExp; to: string }[] = [
  { re: /\bI understand how painful that must be\.?/gi, to: "That stays with you more than you want it to." },
  { re: /\bI understand how you feel\.?/gi, to: "" },
  { re: /\bI understand\.?/gi, to: "" },
  { re: /\bI hear you\.?/gi, to: "" },
  { re: /\bYou are not alone\.?/gi, to: "" },
  { re: /\bYou're not alone\.?/gi, to: "" },
  { re: /\bThat sounds difficult\.?/gi, to: "" },
  { re: /\bThat sounds really hard\.?/gi, to: "" },
  { re: /\bThat sounds hard\.?/gi, to: "" },
  { re: /\bThat sounds heavy\.?/gi, to: "" },
  { re: /\bThat seems heavy\.?/gi, to: "" },
  { re: /\bIt sounds like you're\b/gi, to: "You seem" },
  { re: /\bIt sounds like you are\b/gi, to: "You seem" },
  { re: /\bIt sounds like\b/gi, to: "" },
  { re: /\bIt seems like you're\b/gi, to: "You seem" },
  { re: /\bIt seems like\b/gi, to: "" },
  { re: /\bIt's okay to feel that way\.?/gi, to: "" },
  { re: /\bIt's completely normal to feel\b/gi, to: "It makes sense you feel" },
  { re: /\bI'm here for you\.?/gi, to: "" },
  { re: /\bRemember that\b/gi, to: "" },
];

// Themes we don't want hammered repeatedly within a short window.
const REPETITION_THEMES = [
  "pressure",
  "loneliness",
  "lonely",
  "closeness",
  "intensity",
  "intense",
  "heavy",
  "exhaust",
  "overwhelm",
];

function maxSentencesForMode(mode: string): number {
  switch (mode) {
    case "minimal":
      return 1;
    case "direct":
    case "light":
    case "playful":
      return 2;
    case "reflective":
      return 3;
    case "supportive":
    case "observant":
    default:
      return 2;
  }
}

function splitSentences(text: string): string[] {
  const matches = text.match(/[^.!?]+[.!?]+|\S[^.!?]*$/g);
  return matches ? matches.map((s) => s.trim()).filter(Boolean) : [];
}

function recapitalize(text: string): string {
  let t = text.trim().replace(/^[\s,;:.!?-]+/, "").trim();
  if (!t) return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// Significant-word signature for near-duplicate sentence detection.
function sentenceSignature(sentence: string): string {
  return sentence
    .toLowerCase()
    .replace(/[^a-ząćęłńóśźż0-9\s]/gi, "")
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .sort()
    .join(" ");
}

function stripBannedOpeners(text: string): string {
  let out = text.trim();
  let changed = true;
  // Loop so stacked openers ("I understand. It sounds like...") all go.
  while (changed) {
    changed = false;
    const lower = out.toLowerCase();
    for (const opener of BANNED_OPENERS) {
      if (lower.startsWith(opener)) {
        out = out.slice(opener.length);
        out = recapitalize(out);
        changed = true;
        break;
      }
    }
  }
  return out;
}

function applyPhraseReplacements(text: string): string {
  let out = text;
  for (const { re, to } of PHRASE_REPLACEMENTS) {
    out = out.replace(re, to);
  }
  return out.replace(/\s+/g, " ").replace(/\s+([.!?,])/g, "$1").trim();
}

function dedupeSentences(sentences: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of sentences) {
    const sig = sentenceSignature(s);
    if (sig && seen.has(sig)) continue;
    if (sig) seen.add(sig);
    out.push(s);
  }
  return out;
}

// Drop later sentences that re-hit a theme already used heavily in recent
// replies — keeps the conversation from looping on "pressure"/"loneliness".
function reduceThemeRepetition(
  sentences: string[],
  recentAssistantMessages: string[]
): string[] {
  if (sentences.length <= 1) return sentences;

  const recentText = recentAssistantMessages
    .slice(-3)
    .join(" ")
    .toLowerCase();

  const overusedThemes = REPETITION_THEMES.filter((t) =>
    recentText.includes(t)
  );
  if (overusedThemes.length === 0) return sentences;

  const usedThisReply = new Set<string>();
  const out: string[] = [];

  for (const s of sentences) {
    const lower = s.toLowerCase();
    const theme = overusedThemes.find((t) => lower.includes(t));

    // If this sentence leans on a recently-overused theme that we've already
    // echoed once in this reply, drop it.
    if (theme && usedThisReply.has(theme) && out.length > 0) {
      continue;
    }
    if (theme) usedThisReply.add(theme);
    out.push(s);
  }

  return out.length > 0 ? out : sentences;
}

function pickStrongest(sentences: string[]): string {
  // "Strongest" = the most substantial single sentence (longest meaningful).
  return [...sentences].sort((a, b) => b.length - a.length)[0] || sentences[0];
}

export function rewriteInnerResponse(params: RewriteParams): string {
  const {
    rawResponse,
    conversationMode = "direct",
    emotionalIntensity = 0,
    recentAssistantMessages = [],
  } = params;

  if (!rawResponse) return rawResponse;

  const mode = String(conversationMode);

  // 1. Strip generic openers, soften GPT/therapy phrasing.
  let text = stripBannedOpeners(rawResponse);
  text = applyPhraseReplacements(text);
  text = recapitalize(text);

  if (!text) {
    // Everything was generic filler — fall back to a quiet minimal line
    // rather than returning an empty string.
    return rawResponse.trim();
  }

  // 2. Split, drop duplicate ideas, reduce recently-overused themes.
  let sentences = splitSentences(text);
  sentences = dedupeSentences(sentences);
  sentences = reduceThemeRepetition(sentences, recentAssistantMessages);

  // 3. Shorten. Minimal mode (or very low intensity short talk) collapses to
  //    a single strongest sentence; otherwise cap by mode.
  const maxSentences = maxSentencesForMode(mode);

  if (mode === "minimal" && sentences.length > 1) {
    sentences = [pickStrongest(sentences)];
  } else if (sentences.length > maxSentences) {
    sentences = sentences.slice(0, maxSentences);
  }

  // 4. Subtle variety: in light/playful low-intensity moments, lean toward a
  //    shorter, quieter answer instead of two full sentences.
  if (
    (mode === "light" || mode === "playful") &&
    emotionalIntensity < 25 &&
    sentences.length > 1
  ) {
    sentences = sentences.slice(0, 1);
  }

  const rewritten = sentences.join(" ").replace(/\s+/g, " ").trim();
  return rewritten || rawResponse.trim();
}
