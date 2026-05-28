// ---------------------------------------------------------------------------
// Prompt Context Guardrails v1
// ---------------------------------------------------------------------------
// Keeps the INNER system prompt short, clean, and relevant.
// Pure TypeScript — no AI calls, no embeddings.
//
// Responsibilities:
//   - Trim context to a line budget
//   - Remove duplicate lines
//   - Remove low-value / raw-label lines
//   - Gate whether memory or relationship context should be injected at all

// ---------------------------------------------------------------------------
// Low-value patterns to strip regardless of source
// ---------------------------------------------------------------------------

/** Raw internal pattern keys that should never appear in the prompt. */
const RAW_PATTERN_KEYS = new Set([
  "avoidance",
  "loneliness",
  "pressure",
  "trust_issue",
  "fear_of_rejection",
  "emotional_withdrawal",
  "need_for_reassurance",
  "conflict",
  "rejection",
  "relationship_pattern",
]);

/** Filler / test / trivial phrases that carry no useful context. */
const LOW_VALUE_PHRASES = [
  "no important memories yet",
  "no directly relevant memories",
  "none",
  "undefined",
  "null",
  "n/a",
  "test",
  "debug",
  "lorem ipsum",
  "example",
  // Redundant header-only lines
  "use subtly",
  "do not mention memory unless relevant",
];

function isLowValueLine(line: string): boolean {
  const lower = line.trim().toLowerCase();
  if (!lower) return true;
  if (lower.length < 4) return true;

  for (const phrase of LOW_VALUE_PHRASES) {
    if (lower.includes(phrase)) return true;
  }

  // Lines that are nothing but a raw pattern key (possibly with punctuation).
  const stripped = lower.replace(/[^a-z_]/g, "");
  if (RAW_PATTERN_KEYS.has(stripped)) return true;

  return false;
}

// ---------------------------------------------------------------------------
// Simple messages that need no injected context
// ---------------------------------------------------------------------------

const SIMPLE_INTERJECTIONS = new Set([
  "ok",
  "okay",
  "okej",
  "k",
  "yes",
  "no",
  "yeah",
  "yep",
  "nope",
  "thanks",
  "thank you",
  "thx",
  "lol",
  "haha",
  "hehe",
  "xd",
  "ha",
  "wow",
  "nice",
  "cool",
  "great",
  "sure",
  "fine",
  "good",
  "got it",
  "understood",
  "ок",
  "oke",
  "tak",
  "nie",
  "dzięki",
  "dzieki",
  "super",
]);

const SIMPLE_QUESTION_PATTERNS = [
  /^what time is it/i,
  /^what('s| is) the (time|date|day)/i,
  /^jaka (jest )?(godzina|data|dziś|dzis)/i,
  /^która godzina/i,
  /^ktora godzina/i,
  /^ile (jest )?godzin/i,
  /^hej$/i,
  /^siema$/i,
  /^cześć$/i,
  /^czesc$/i,
  /^hello$/i,
  /^hi$/i,
  /^hey$/i,
];

const FACTUAL_QUESTION_PATTERNS = [
  /^(what|who|where|when|how|why|which)\b/i,
  /^(co|gdzie|kiedy|jak|dlaczego|który|która|ile)\b/i,
  /^(can you|could you|would you|tell me)\b/i,
  /^(powiedz mi|wyjaśnij|co to jest)\b/i,
];

function isSimpleMessage(message: string): boolean {
  const text = message.trim().toLowerCase();
  if (!text) return true;
  if (SIMPLE_INTERJECTIONS.has(text)) return true;
  if (SIMPLE_QUESTION_PATTERNS.some((re) => re.test(text))) return true;
  // Very short single-word or two-word messages with no emotional content.
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (wordCount <= 2 && !text.includes("?")) return true;
  return false;
}

function isFactualQuestion(message: string): boolean {
  const text = message.trim().toLowerCase();
  return FACTUAL_QUESTION_PATTERNS.some((re) => re.test(text));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Removes duplicate lines (case-insensitive, ignores leading bullet/dash).
 */
export function removeDuplicateContextLines(context: string): string {
  const seen = new Set<string>();
  return context
    .split("\n")
    .filter((line) => {
      const key = line.trim().replace(/^[-•*]\s*/, "").toLowerCase();
      if (!key) return true; // keep blank separator lines
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join("\n");
}

/**
 * Removes lines that carry no useful context (raw pattern labels, filler,
 * trivial phrases, undefined/null artefacts).
 */
export function removeLowValueContextLines(context: string): string {
  return context
    .split("\n")
    .filter((line) => {
      if (!line.trim()) return true; // keep blank separators
      return !isLowValueLine(line);
    })
    .join("\n");
}

/**
 * Collapses a multi-line context string to at most `maxLines` non-empty lines,
 * preserving order. Blank separator lines are not counted towards the budget.
 */
export function trimPromptContext(context: string, maxLines = 8): string {
  let count = 0;
  const out: string[] = [];
  for (const line of context.split("\n")) {
    if (line.trim() === "") {
      out.push(line);
      continue;
    }
    if (count >= maxLines) continue;
    out.push(line);
    count++;
  }
  return out.join("\n");
}

/**
 * Returns true when the compressed memory context should be injected into the
 * prompt for this turn. Skip for trivial one-word messages that need no
 * personal context.
 */
export function shouldInjectMemoryContext(
  userMessage: string,
  conversationMode: string
): boolean {
  if (!userMessage) return false;
  if (isSimpleMessage(userMessage)) return false;
  // Fast/minimal mode only gets context if there's actual emotional weight.
  if (conversationMode === "minimal") return false;
  return true;
}

/**
 * Returns true when relationship / pattern context should be injected.
 * Skip for simple messages and purely factual questions without relationship
 * overtones.
 */
export function shouldInjectRelationshipContext(
  userMessage: string,
  reflectionDecision: boolean
): boolean {
  if (!userMessage) return false;
  if (!reflectionDecision) return false;
  if (isSimpleMessage(userMessage)) return false;
  if (isFactualQuestion(userMessage)) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Convenience: run the full cleanup pipeline on a context string and return
// the sanitised result alongside a decision log for tracing.
// ---------------------------------------------------------------------------

export type GuardrailsResult = {
  memoryContext: string;
  relationshipContext: string;
  injectMemory: boolean;
  injectRelationship: boolean;
  memoryLineCount: number;
  relationshipLineCount: number;
};

export function applyPromptGuardrails(params: {
  rawMemoryContext: string;
  rawRelationshipContext: string;
  userMessage: string;
  conversationMode: string;
  reflectionDecision: boolean;
  maxMemoryLines?: number;
  maxRelationshipLines?: number;
}): GuardrailsResult {
  const {
    rawMemoryContext,
    rawRelationshipContext,
    userMessage,
    conversationMode,
    reflectionDecision,
    maxMemoryLines = 8,
    maxRelationshipLines = 3,
  } = params;

  const injectMemory = shouldInjectMemoryContext(userMessage, conversationMode);
  const injectRelationship = shouldInjectRelationshipContext(
    userMessage,
    reflectionDecision
  );

  let memoryContext = "";
  if (injectMemory) {
    memoryContext = removeLowValueContextLines(rawMemoryContext);
    memoryContext = removeDuplicateContextLines(memoryContext);
    memoryContext = trimPromptContext(memoryContext, maxMemoryLines);
  }

  let relationshipContext = "";
  if (injectRelationship) {
    relationshipContext = removeLowValueContextLines(rawRelationshipContext);
    relationshipContext = removeDuplicateContextLines(relationshipContext);
    relationshipContext = trimPromptContext(
      relationshipContext,
      maxRelationshipLines
    );
  }

  const countNonEmpty = (s: string) =>
    s.split("\n").filter((l) => l.trim()).length;

  const result: GuardrailsResult = {
    memoryContext,
    relationshipContext,
    injectMemory,
    injectRelationship,
    memoryLineCount: countNonEmpty(memoryContext),
    relationshipLineCount: countNonEmpty(relationshipContext),
  };

  console.log("PROMPT_GUARDRAILS_DECISION", {
    injectMemory,
    injectRelationship,
    memoryLineCount: result.memoryLineCount,
    relationshipLineCount: result.relationshipLineCount,
    conversationMode,
    userMessageSnippet: userMessage.slice(0, 60),
  });

  const allLines = [
    ...memoryContext.split("\n"),
    ...relationshipContext.split("\n"),
  ].filter((l) => l.trim());

  console.log("FINAL_CONTEXT_LINES", allLines);

  return result;
}
