// ---------------------------------------------------------------------------
// Response Speed & Typing Realism Engine
// ---------------------------------------------------------------------------
// Makes INNER feel alive by varying response delay, typing speed, and pacing
// instead of behaving with mechanical consistency. Pure local logic: no AI
// calls, no streaming APIs. Mild randomness is intentional here — that is what
// removes the robotic uniformity — but it is always bounded so simple replies
// stay snappy.

import type { ConversationMode } from "@/lib/conversationMode";

export type TypingSpeed = "instant" | "fast" | "normal" | "slow";

export type TypingProfile = {
  responseDelayMs: number;
  typingSpeed: TypingSpeed;
  pauseMoments?: number[];
  messageStyle: "short" | "medium" | "long";
};

export type TypingChunk = {
  text: string;
  pauseAfterMs: number;
};

type GenerateParams = {
  conversationMode: ConversationMode | string;
  emotionalIntensity: number; // 0-100
  responseLength: number; // characters
  interactionDepth?: number;
  userMessageLength?: number;
};

const DELAY_RANGES: Record<TypingSpeed, [number, number]> = {
  instant: [100, 300],
  fast: [300, 700],
  normal: [700, 1600],
  slow: [1600, 3000],
};

// Approximate per-character reveal speed (ms/char) for each typing speed.
export const TYPING_MS_PER_CHAR: Record<TypingSpeed, number> = {
  instant: 6,
  fast: 12,
  normal: 22,
  slow: 34,
};

function randInRange([min, max]: [number, number]): number {
  return Math.round(min + Math.random() * (max - min));
}

// Treat tiny replies ("ok", "yes", "sure") as essentially instant regardless
// of mode — rule: never long delays for simple replies.
const TINY_REPLY_CHARS = 12;
const SHORT_REPLY_CHARS = 40;

function baseSpeedForMode(mode: string): TypingSpeed {
  switch (mode) {
    case "minimal":
      return "instant";
    case "direct":
    case "light":
    case "playful":
      return "fast";
    case "supportive":
    case "observant":
      return "normal";
    case "reflective":
      return "slow";
    default:
      return "normal";
  }
}

function messageStyleForLength(len: number): TypingProfile["messageStyle"] {
  if (len <= SHORT_REPLY_CHARS) return "short";
  if (len <= 280) return "medium";
  return "long";
}

export function generateTypingProfile(
  params: GenerateParams
): TypingProfile {
  const {
    conversationMode,
    emotionalIntensity,
    responseLength,
  } = params;

  let typingSpeed = baseSpeedForMode(String(conversationMode));

  // Simple, short replies must never feel slow — clamp speed up.
  if (responseLength <= TINY_REPLY_CHARS) {
    typingSpeed = "instant";
  } else if (responseLength <= SHORT_REPLY_CHARS && typingSpeed === "slow") {
    typingSpeed = "normal";
  }

  // High emotional intensity in calm/holding modes leans a touch slower, but
  // only when the reply is actually substantial.
  if (
    emotionalIntensity >= 60 &&
    responseLength > SHORT_REPLY_CHARS &&
    (typingSpeed === "fast" || typingSpeed === "normal")
  ) {
    typingSpeed = typingSpeed === "fast" ? "normal" : "slow";
  }

  let responseDelayMs = randInRange(DELAY_RANGES[typingSpeed]);

  // Hard guard: tiny replies stay near-instant even if the mode wanted a wait.
  if (responseLength <= TINY_REPLY_CHARS) {
    responseDelayMs = randInRange(DELAY_RANGES.instant);
  }

  const messageStyle = messageStyleForLength(responseLength);

  // Optional pause moments — only for slower, more thoughtful pacing. These
  // are character indices the UI can linger on briefly.
  let pauseMoments: number[] | undefined;
  if (
    (typingSpeed === "slow" || typingSpeed === "normal") &&
    responseLength > SHORT_REPLY_CHARS
  ) {
    const count = typingSpeed === "slow" ? 2 : 1;
    pauseMoments = [];
    for (let i = 1; i <= count; i++) {
      pauseMoments.push(Math.floor((responseLength * i) / (count + 1)));
    }
  }

  return {
    responseDelayMs,
    typingSpeed,
    pauseMoments,
    messageStyle,
  };
}

// Splits text into natural reveal chunks with a suggested pause after each.
// Sentence-ending punctuation, commas, and paragraph breaks each get a
// different pause length so the reveal breathes like real typing.
export function generateTypingChunks(text: string): TypingChunk[] {
  const source = (text || "").trim();
  if (!source) return [];

  const chunks: TypingChunk[] = [];
  // Capture each segment plus its trailing delimiter (punctuation / newline).
  const regex = /[^.!?\n,]+[.!?,]*\n*|\n+/g;
  const matches = source.match(regex);

  if (!matches) {
    return [{ text: source, pauseAfterMs: 0 }];
  }

  for (const rawSegment of matches) {
    const segment = rawSegment.replace(/\n+$/g, "");
    const trailingNewlines = rawSegment.length - segment.length;

    if (segment.trim().length === 0) {
      // Pure paragraph break.
      if (chunks.length > 0) {
        chunks[chunks.length - 1].pauseAfterMs = randInRange([600, 900]);
      }
      continue;
    }

    let pauseAfterMs = 0;
    const lastChar = segment.trim().slice(-1);

    if (trailingNewlines > 0) {
      pauseAfterMs = randInRange([600, 900]); // paragraph pause
    } else if (lastChar === "." || lastChar === "!" || lastChar === "?") {
      pauseAfterMs = randInRange([300, 500]); // sentence pause
    } else if (lastChar === ",") {
      pauseAfterMs = randInRange([120, 220]); // comma pause
    }

    chunks.push({ text: rawSegment.replace(/\n+$/g, ""), pauseAfterMs });
  }

  // No artificial pause after the very last chunk.
  if (chunks.length > 0) {
    chunks[chunks.length - 1].pauseAfterMs = 0;
  }

  return chunks;
}
