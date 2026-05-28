// ---------------------------------------------------------------------------
// INNER Presence Engine v1
// ---------------------------------------------------------------------------
// Gives INNER a sense of "presence" between messages — a quiet state shown
// under the ONLINE status. Pure TypeScript, no AI calls. Deterministic per
// input so the same context always yields the same presence.

import type { ConversationMode } from "@/lib/conversationMode";

export type PresenceState =
  | "listening"
  | "reflective"
  | "observing"
  | "concerned"
  | "curious"
  | "calm"
  | "energized";

type DeriveParams = {
  emotionalIntensity?: number;
  conversationMode?: ConversationMode | string;
  relationshipStage?: string;
  recentUserMessages?: string[];
};

const DISTRESS_WORDS = [
  "exhausted",
  "tired",
  "drained",
  "overwhelmed",
  "anxious",
  "scared",
  "afraid",
  "hurt",
  "alone",
  "lonely",
  "depressed",
  "hopeless",
  "broken",
  "can't",
  "cant",
  // Polish
  "zmęczony",
  "zmeczony",
  "wykończony",
  "samotny",
  "boję",
  "boje",
  "smutny",
];

const CURIOUS_WORDS = [
  "idea",
  "thinking about",
  "what if",
  "maybe i",
  "i want to build",
  "i want to make",
  "new project",
  "i could",
  "pomysł",
  "pomysl",
  "co jeśli",
  "co jesli",
];

const ENERGIZED_WORDS = [
  "excited",
  "can't wait",
  "cant wait",
  "let's go",
  "lets go",
  "amazing",
  "awesome",
  "finally",
  "pumped",
  "nie mogę się doczekać",
];

const UNCERTAINTY_MARKERS = [
  "i don't know what i feel",
  "i dont know what i feel",
  "i don't know",
  "i dont know",
  "not sure",
  "confused",
  "mixed",
  "can't tell",
  "cant tell",
  "nie wiem",
  "nie jestem pewny",
  "nie jestem pewna",
];

function includesAny(text: string, list: string[]): boolean {
  return list.some((w) => text.includes(w));
}

function seedFrom(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h * 31 + text.charCodeAt(i)) % 100000;
  }
  return h / 100000;
}

export function derivePresenceState(params: DeriveParams): PresenceState {
  const {
    emotionalIntensity = 0,
    conversationMode = "direct",
    recentUserMessages = [],
  } = params;

  const lastMessage = (recentUserMessages[recentUserMessages.length - 1] || "")
    .toLowerCase()
    .trim();
  const mode = String(conversationMode);

  // 1. Distress / high intensity -> concerned.
  if (emotionalIntensity >= 55 || includesAny(lastMessage, DISTRESS_WORDS)) {
    return "concerned";
  }

  // 2. Explicit uncertainty -> reflective.
  if (includesAny(lastMessage, UNCERTAINTY_MARKERS)) {
    return "reflective";
  }

  // 3. New ideas / curiosity.
  if (includesAny(lastMessage, ENERGIZED_WORDS)) {
    return "energized";
  }
  if (includesAny(lastMessage, CURIOUS_WORDS)) {
    return "curious";
  }

  // 4. Conversation stance.
  if (mode === "reflective") return "reflective";
  if (mode === "observant") return "observing";
  if (mode === "supportive") return "concerned";

  // 5. Calm low-intensity moments.
  if (emotionalIntensity < 20) return "calm";

  // 6. Default.
  return "listening";
}

// Each state has a few interchangeable subtitles; one is chosen
// deterministically so it varies between turns without flickering randomly.
const SUBTITLES: Record<PresenceState, string[]> = {
  listening: ["Listening quietly.", "Paying attention.", "Following your train of thought."],
  reflective: ["Reflecting with you.", "Thinking about what matters.", "Sitting with that."],
  observing: ["Paying attention.", "Noticing the small things.", "Watching how this unfolds."],
  concerned: ["Holding space.", "Here with you.", "Staying close."],
  curious: ["Curious where this leads.", "Interested in this.", "Leaning in a little."],
  calm: ["Here, unhurried.", "Quietly present.", "At ease with you."],
  energized: ["Right there with you.", "Feeling the spark.", "Ready when you are."],
};

export function getPresenceSubtitle(
  state: PresenceState,
  seedText = ""
): string {
  const options = SUBTITLES[state] ?? SUBTITLES.listening;
  const idx = Math.floor(seedFrom(seedText || state) * options.length) % options.length;
  return options[idx];
}
