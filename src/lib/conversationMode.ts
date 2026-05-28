// ---------------------------------------------------------------------------
// Human Conversation Mode Balancer
// ---------------------------------------------------------------------------
// Picks ONE conversational stance per turn so INNER feels alive and adaptive
// instead of behaving like a constant therapist. Pure TypeScript: no AI calls,
// no embeddings, fully deterministic (no Math.random) so behavior stays
// emotionally believable rather than chaotic.

export type ConversationMode =
  | "direct"
  | "light"
  | "reflective"
  | "supportive"
  | "observant"
  | "playful"
  | "minimal";

type DetectParams = {
  userMessage: string;
  emotionalIntensity: number; // 0-100
  relationshipReflectionDecision: boolean;
  recentAssistantMessages: string[];
  currentMoodState?: string;
  interactionDepth?: number;
};

const DISTRESS_WORDS = [
  // English
  "alone",
  "lonely",
  "exhausted",
  "burned out",
  "burnout",
  "empty",
  "hopeless",
  "can't anymore",
  "cant anymore",
  "give up",
  "worthless",
  "depressed",
  "breaking down",
  "overwhelmed",
  // Polish
  "samotny",
  "samotnie",
  "zmęczony",
  "zmeczony",
  "wyczerpany",
  "pusto",
  "bez sensu",
  "nie daję rady",
  "nie daje rady",
  "załamany",
  "zalamany",
  "przytłoczony",
  "przytloczony",
];

const EXISTENTIAL_WORDS = [
  // English
  "meaning",
  "purpose",
  "why am i",
  "what's the point",
  "whats the point",
  "who am i",
  "lost in life",
  "future",
  "afraid of",
  "relationship",
  "do they care",
  "does she care",
  "does he care",
  // Polish
  "sens",
  "po co",
  "kim jestem",
  "przyszłość",
  "przyszlosc",
  "związek",
  "zwiazek",
  "czy jej zależy",
  "czy mu zależy",
  "czy im zależy",
];

const FACTUAL_STARTERS = [
  "what",
  "when",
  "where",
  "which",
  "who",
  "how much",
  "how many",
  "how do",
  "how can",
  "can you",
  "could you",
  "give me",
  "show me",
  "fix",
  "explain",
  "list",
  "co to",
  "jak ",
  "ile ",
  "gdzie ",
  "kiedy ",
  "napisz",
  "popraw",
  "pokaż",
  "pokaz",
  "wyjaśnij",
  "wyjasnij",
];

const PLAYFUL_WORDS = [
  "haha",
  "lol",
  "xd",
  "joke",
  "funny",
  "😂",
  "😄",
  "😅",
  "🤣",
  "żart",
  "śmiesz",
  "smiesz",
  "hehe",
];

function includesAny(text: string, words: string[]): boolean {
  return words.some((w) => text.includes(w));
}

function startsWithAny(text: string, starters: string[]): boolean {
  return starters.some((s) => text.startsWith(s));
}

// Heuristic: did INNER already lean reflective/observant in its recent replies?
// We have no server-side mode history, so we read it back out of the recent
// assistant messages. Markers are intentionally soft-language cues that the
// reflective/observant instructions tend to produce.
const REFLECTIVE_MARKERS = [
  "seems",
  "seem to",
  "part of you",
  "i notice",
  "i'm noticing",
  "im noticing",
  "it sounds like",
  "you may be",
  "you might be",
  "underneath",
  "carrying",
  "wydaje się",
  "wydaje sie",
  "część ciebie",
  "czesc ciebie",
  "zauważam",
  "zauwazam",
];

function countReflectiveRecent(recentAssistantMessages: string[]): number {
  let count = 0;
  for (const msg of recentAssistantMessages.slice(-3)) {
    const lower = (msg || "").toLowerCase();
    if (includesAny(lower, REFLECTIVE_MARKERS)) count += 1;
  }
  return count;
}

function playedRecently(recentAssistantMessages: string[]): boolean {
  return recentAssistantMessages
    .slice(-2)
    .some((msg) => includesAny((msg || "").toLowerCase(), PLAYFUL_WORDS));
}

export function detectConversationMode(params: DetectParams): ConversationMode {
  const {
    userMessage,
    emotionalIntensity,
    relationshipReflectionDecision,
    recentAssistantMessages,
  } = params;

  const text = (userMessage || "").toLowerCase().trim();
  const wordCount = text.length === 0 ? 0 : text.split(/\s+/).filter(Boolean).length;
  const isQuestion = text.endsWith("?");

  // 1. Distress always takes priority — real pain overrides everything,
  //    including the anti-overanalysis bias below.
  if (emotionalIntensity >= 60 && includesAny(text, DISTRESS_WORDS)) {
    return "supportive";
  }

  const reflectedRecently = countReflectiveRecent(recentAssistantMessages) >= 2;
  const isShortCold = wordCount > 0 && wordCount <= 3 && emotionalIntensity < 30;

  // 2. Clear factual / practical requests get a straight answer.
  const factual =
    (isQuestion && emotionalIntensity < 40) ||
    startsWithAny(text, FACTUAL_STARTERS);
  if (factual && !includesAny(text, EXISTENTIAL_WORDS)) {
    return "direct";
  }

  // 3. Anti-overanalysis: if INNER has been reflective/observant lately,
  //    deliberately lighten up rather than stack more analysis.
  if (reflectedRecently) {
    if (isShortCold) return "minimal";
    if (emotionalIntensity < 35) return "light";
    return "direct";
  }

  // 4. Deep / existential / relationship confusion -> reflective.
  if (
    includesAny(text, EXISTENTIAL_WORDS) ||
    (emotionalIntensity >= 45 && wordCount >= 8)
  ) {
    return "reflective";
  }

  // 5. Contradictions / emotional tension surfaced by the relationship engine.
  if (relationshipReflectionDecision && emotionalIntensity >= 30) {
    return "observant";
  }

  // 6. User is short/cold or the conversation is winding down.
  if (isShortCold) {
    return "minimal";
  }

  // 7. Occasional playfulness — only when it's genuinely light and not
  //    already used in the last couple of replies.
  if (
    emotionalIntensity < 25 &&
    includesAny(text, PLAYFUL_WORDS) &&
    !playedRecently(recentAssistantMessages)
  ) {
    return "playful";
  }

  // 8. Low-stakes casual conversation.
  if (emotionalIntensity < 35) {
    return "light";
  }

  // Default: answer naturally and directly.
  return "direct";
}

const STYLE_INSTRUCTIONS: Record<ConversationMode, string> = {
  direct: "Answer clearly and naturally. Do not analyze emotions.",
  light: "Keep the tone relaxed and human.",
  reflective: "Use gentle emotional insight, but stay subtle.",
  supportive: "Be warm and steady. Hold space without fixing or analyzing.",
  observant: "Notice emotional nuance without sounding clinical.",
  playful: "Let the tone be light and a little playful. Keep it brief.",
  minimal: "Keep the response short and calm.",
};

export function getConversationStyleInstruction(
  mode: ConversationMode
): string {
  return `Conversation style:\n- ${STYLE_INSTRUCTIONS[mode]}`;
}
