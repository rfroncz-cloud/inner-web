// ---------------------------------------------------------------------------
// User Profile Engine v1
// ---------------------------------------------------------------------------
// INNER builds an evolving, soft understanding of the user from existing
// memories. Pure pattern detection — no AI calls, no embeddings.
//
// Design notes:
// - Profiles are built from cumulative "tallies" (raw keyword hit counts).
//   Storing tallies makes updateUserProfile() additive, so a single new
//   memory nudges the profile gradually instead of overwriting it.
// - A categorical winner (e.g. communicationStyle) only changes when its
//   cumulative evidence surpasses the current leader — high-confidence facts
//   are not flipped by one stray message.
// - Confidence ramps with both dominance (how clearly one option leads) and
//   volume (how much evidence exists). One hit never reads as certainty.
// - Language stays soft and non-diagnostic. No clinical terms.

export type CommunicationStyle = "direct" | "reflective" | "analytical" | "emotional";
export type DecisionStyle = "impulsive" | "cautious" | "strategic";
export type RelationshipStyle = "avoidant" | "secure" | "seeking_connection";

export type ScoredStyle<T extends string> = {
  value: T;
  confidence: number; // 0–100
};

export type ScoredItem = {
  label: string;
  confidence: number; // 0–100
  count: number;
};

type Tally = Record<string, number>;

export type ProfileTallies = {
  communication: Tally;
  decision: Tally;
  relationship: Tally;
  traits: Tally;
  goals: Tally;
  fears: Tally;
  values: Tally;
  interests: Tally;
};

export type UserProfile = {
  communicationStyle: ScoredStyle<CommunicationStyle> | null;
  decisionMakingStyle: ScoredStyle<DecisionStyle> | null;
  relationshipStyle: ScoredStyle<RelationshipStyle> | null;
  personalityTraits: ScoredItem[];
  goals: ScoredItem[];
  fears: ScoredItem[];
  values: ScoredItem[];
  interests: ScoredItem[];
  profileConfidence: number; // 0–100
  evidenceCount: number;
  // Internal cumulative tallies — kept so the profile can evolve gradually.
  tallies: ProfileTallies;
};

export type MemoryInput = {
  memory?: string;
  text?: string;
};

// ─── Keyword banks ─────────────────────────────────────────────────────────────
// English-first with light Polish support, matching the rest of INNER.

const COMMUNICATION_KEYWORDS: Record<CommunicationStyle, string[]> = {
  direct: [
    "honestly", "just tell me", "straight up", "to the point", "be direct",
    "no bullshit", "bluntly", "cut to", "say it", "wprost", "szczerze",
  ],
  reflective: [
    "i think", "i wonder", "maybe", "i've been thinking", "i feel like",
    "reflect", "sit with", "looking back", "myślę", "zastanawiam",
  ],
  analytical: [
    "because", "therefore", "analyze", "logically", "the reason", "pros and cons",
    "compare", "makes sense", "figure out", "structure", "analiz", "logicz",
  ],
  emotional: [
    "i feel", "overwhelmed", "i'm scared", "so happy", "heartbroken", "i love",
    "i hate", "excited", "hurt", "crying", "czuję", "boję",
  ],
};

const DECISION_KEYWORDS: Record<DecisionStyle, string[]> = {
  impulsive: [
    "just did it", "spontaneous", "on a whim", "without thinking", "suddenly decided",
    "couldn't wait", "jumped in", "spontanicznie", "od razu",
  ],
  cautious: [
    "not sure", "what if", "carefully", "hesitant", "afraid to", "double check",
    "play it safe", "worried about", "ostrożnie", "boję się",
  ],
  strategic: [
    "plan", "long term", "strategy", "step by step", "roadmap", "prioritize",
    "calculated", "thinking ahead", "long-term", "strateg", "planuj",
  ],
};

const RELATIONSHIP_KEYWORDS: Record<RelationshipStyle, string[]> = {
  avoidant: [
    "need space", "pull away", "keep my distance", "on my own", "don't need anyone",
    "withdraw", "shut down", "alone is fine", "dystans", "sam sobie",
  ],
  secure: [
    "i trust", "we talk", "comfortable with", "support each other", "honest with",
    "safe with", "open with", "ufam", "rozmawiamy",
  ],
  seeking_connection: [
    "lonely", "want to connect", "i miss", "need someone", "reach out", "belong",
    "feel close", "want closeness", "samotny", "tęsknię",
  ],
};

const TRAIT_KEYWORDS: Record<string, string[]> = {
  ambitious: ["ambitious", "driven", "achieve", "grind", "hustle", "build something", "ambitn"],
  introspective: ["overthink", "in my head", "analyze myself", "introspect", "self-aware", "rozkminiam"],
  empathetic: ["care about others", "feel for", "empathy", "help people", "others' feelings"],
  resilient: ["keep going", "push through", "bounce back", "resilient", "don't give up", "nie poddaję"],
  creative: ["creative", "design", "make art", "imagine", "compose", "write music", "twórcz"],
  perfectionist: ["perfect", "not good enough", "high standards", "every detail", "flawless"],
};

const VALUE_KEYWORDS: Record<string, string[]> = {
  honesty: ["honesty", "honest", "truth", "authentic", "szczerość", "prawda"],
  freedom: ["freedom", "independence", "free to", "autonomy", "wolność"],
  family: ["family", "my kids", "my wife", "my husband", "loved ones", "rodzina"],
  loyalty: ["loyalty", "loyal", "stand by", "lojalność"],
  growth: ["growth", "grow", "improve", "become better", "self improvement", "rozwój"],
  integrity: ["integrity", "principles", "do the right thing", "values"],
  connection: ["connection", "closeness", "belonging", "relationships matter"],
  security: ["security", "stability", "safe future", "stabilność"],
};

const INTEREST_KEYWORDS: Record<string, string[]> = {
  music: ["music", "guitar", "piano", "song", "muzyka"],
  coding: ["coding", "programming", "developer", "software", "code", "programuj"],
  fitness: ["gym", "fitness", "workout", "training", "siłownia", "trening"],
  reading: ["reading", "books", "novel", "książki"],
  travel: ["travel", "traveling", "trip", "abroad", "podróż"],
  gaming: ["gaming", "games", "gamer", "gry"],
  art: ["art", "drawing", "painting", "sztuka"],
  business: ["startup", "business", "entrepreneur", "company", "biznes", "firma"],
  writing: ["writing", "journaling", "blog", "pisanie"],
  film: ["movies", "films", "cinema", "filmy"],
};

// Phrase-capturing triggers for goals & fears (capture a short snippet).
const GOAL_TRIGGERS = [
  "i want to", "trying to", "my goal is", "i hope to", "working on", "i'm building",
  "planning to", "i dream of", "aiming to", "i'd like to", "chcę",
];

const FEAR_TRIGGERS = [
  "i'm afraid of", "afraid of", "scared of", "i fear", "terrified of", "worried about",
  "anxious about", "nervous about", "i dread", "boję się",
];

// ─── Helpers ────────────────────────────────────────────────────────────────────

function emptyTally(keys: string[]): Tally {
  const t: Tally = {};
  for (const k of keys) t[k] = 0;
  return t;
}

function emptyTallies(): ProfileTallies {
  return {
    communication: emptyTally(Object.keys(COMMUNICATION_KEYWORDS)),
    decision: emptyTally(Object.keys(DECISION_KEYWORDS)),
    relationship: emptyTally(Object.keys(RELATIONSHIP_KEYWORDS)),
    traits: emptyTally(Object.keys(TRAIT_KEYWORDS)),
    goals: {},
    fears: {},
    values: emptyTally(Object.keys(VALUE_KEYWORDS)),
    interests: emptyTally(Object.keys(INTEREST_KEYWORDS)),
  };
}

function memoryText(m: MemoryInput | string): string {
  if (typeof m === "string") return m;
  return (m.memory ?? m.text ?? "").toString();
}

function countMatches(
  lower: string,
  bank: Record<string, string[]>,
  tally: Tally
) {
  for (const [key, words] of Object.entries(bank)) {
    for (const word of words) {
      if (lower.includes(word)) {
        tally[key] = (tally[key] ?? 0) + 1;
        break; // one hit per key per memory keeps signals balanced
      }
    }
  }
}

function capturePhrase(lower: string, triggers: string[], tally: Tally) {
  for (const trigger of triggers) {
    const idx = lower.indexOf(trigger);
    if (idx === -1) continue;
    const after = lower.slice(idx + trigger.length);
    // Take up to the next clause boundary, keep it short.
    const snippet = after.split(/[.,;!?\n]/)[0].trim();
    if (snippet.length >= 3 && snippet.length <= 60) {
      const label = snippet.replace(/\s+/g, " ");
      tally[label] = (tally[label] ?? 0) + 1;
    }
    break; // one phrase per category per memory
  }
}

// Fold a single memory's signals into a tallies object (mutates in place).
function ingest(tallies: ProfileTallies, raw: string) {
  const lower = raw.toLowerCase();
  if (!lower.trim()) return;
  countMatches(lower, COMMUNICATION_KEYWORDS, tallies.communication);
  countMatches(lower, DECISION_KEYWORDS, tallies.decision);
  countMatches(lower, RELATIONSHIP_KEYWORDS, tallies.relationship);
  countMatches(lower, TRAIT_KEYWORDS, tallies.traits);
  countMatches(lower, VALUE_KEYWORDS, tallies.values);
  countMatches(lower, INTEREST_KEYWORDS, tallies.interests);
  capturePhrase(lower, GOAL_TRIGGERS, tallies.goals);
  capturePhrase(lower, FEAR_TRIGGERS, tallies.fears);
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

// Pick the leading categorical style with a confidence that blends dominance
// (lead over the field) and volume (total evidence).
function pickStyle<T extends string>(tally: Tally): ScoredStyle<T> | null {
  const entries = Object.entries(tally).filter(([, v]) => v > 0);
  if (entries.length === 0) return null;

  entries.sort((a, b) => b[1] - a[1]);
  const [winnerKey, winnerCount] = entries[0];
  const total = entries.reduce((sum, [, v]) => sum + v, 0);

  const dominance = winnerCount / total; // 0..1
  const volume = Math.min(1, total / 6); // ~6 hits → full volume weight
  const confidence = Math.round(clamp(dominance * volume * 100));

  return { value: winnerKey as T, confidence };
}

// Turn a free tally into scored list items (sorted, capped).
function scoreItems(tally: Tally, limit: number): ScoredItem[] {
  return Object.entries(tally)
    .filter(([, count]) => count > 0)
    .map(([label, count]) => ({
      label,
      count,
      // 1 hit → 40, then +20 per repeat, capped.
      confidence: Math.round(clamp(40 + (count - 1) * 20)),
    }))
    .sort((a, b) => b.count - a.count || b.confidence - a.confidence)
    .slice(0, limit);
}

// Recompute the public scored profile from cumulative tallies.
function deriveProfile(tallies: ProfileTallies, evidenceCount: number): UserProfile {
  const communicationStyle = pickStyle<CommunicationStyle>(tallies.communication);
  const decisionMakingStyle = pickStyle<DecisionStyle>(tallies.decision);
  const relationshipStyle = pickStyle<RelationshipStyle>(tallies.relationship);
  const personalityTraits = scoreItems(tallies.traits, 5);
  const goals = scoreItems(tallies.goals, 5);
  const fears = scoreItems(tallies.fears, 5);
  const values = scoreItems(tallies.values, 5);
  const interests = scoreItems(tallies.interests, 6);

  // Overall confidence: how many categories are populated × how much evidence.
  const filled = [
    communicationStyle,
    decisionMakingStyle,
    relationshipStyle,
    personalityTraits.length ? {} : null,
    goals.length ? {} : null,
    values.length ? {} : null,
    interests.length ? {} : null,
  ].filter(Boolean).length;

  const coverage = filled / 7; // 0..1
  const volume = Math.min(1, evidenceCount / 12);
  const profileConfidence = Math.round(clamp((coverage * 0.5 + volume * 0.5) * 100));

  return {
    communicationStyle,
    decisionMakingStyle,
    relationshipStyle,
    personalityTraits,
    goals,
    fears,
    values,
    interests,
    profileConfidence,
    evidenceCount,
    tallies,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function buildUserProfile(memories: (MemoryInput | string)[]): UserProfile {
  const tallies = emptyTallies();
  let evidenceCount = 0;

  for (const m of memories ?? []) {
    const raw = memoryText(m);
    if (!raw.trim()) continue;
    ingest(tallies, raw);
    evidenceCount += 1;
  }

  return deriveProfile(tallies, evidenceCount);
}

export function updateUserProfile(
  profile: UserProfile,
  newMemory: MemoryInput | string
): UserProfile {
  const raw = memoryText(newMemory);
  if (!raw.trim()) return profile;

  // Deep-ish clone of tallies so the update stays additive and gradual.
  const tallies: ProfileTallies = {
    communication: { ...profile.tallies.communication },
    decision: { ...profile.tallies.decision },
    relationship: { ...profile.tallies.relationship },
    traits: { ...profile.tallies.traits },
    goals: { ...profile.tallies.goals },
    fears: { ...profile.tallies.fears },
    values: { ...profile.tallies.values },
    interests: { ...profile.tallies.interests },
  };

  ingest(tallies, raw);
  return deriveProfile(tallies, profile.evidenceCount + 1);
}

const COMMUNICATION_PHRASES: Record<CommunicationStyle, string> = {
  direct: "communicate pretty directly",
  reflective: "tend to think things through before speaking",
  analytical: "lean on logic and reasoning",
  emotional: "speak from how you feel",
};

const DECISION_PHRASES: Record<DecisionStyle, string> = {
  impulsive: "decide quickly, on instinct",
  cautious: "weigh decisions carefully",
  strategic: "plan decisions with the long game in mind",
};

const RELATIONSHIP_PHRASES: Record<RelationshipStyle, string> = {
  avoidant: "value your space when things get heavy",
  secure: "seem comfortable being open with people you trust",
  seeking_connection: "seem to want closeness and connection",
};

// Soft, human, non-diagnostic summary. Only mentions things with enough signal.
export function getProfileSummary(profile: UserProfile): string {
  if (profile.evidenceCount === 0 || profile.profileConfidence < 15) {
    return "INNER is still getting to know you.";
  }

  const parts: string[] = [];
  const MIN = 35;

  if (profile.communicationStyle && profile.communicationStyle.confidence >= MIN) {
    parts.push(`You ${COMMUNICATION_PHRASES[profile.communicationStyle.value]}`);
  }
  if (profile.decisionMakingStyle && profile.decisionMakingStyle.confidence >= MIN) {
    parts.push(`you ${DECISION_PHRASES[profile.decisionMakingStyle.value]}`);
  }
  if (profile.relationshipStyle && profile.relationshipStyle.confidence >= MIN) {
    parts.push(`you ${RELATIONSHIP_PHRASES[profile.relationshipStyle.value]}`);
  }

  const topValues = profile.values.filter((v) => v.confidence >= MIN).slice(0, 2);
  if (topValues.length) {
    parts.push(`what seems to matter most is ${topValues.map((v) => v.label).join(" and ")}`);
  }

  const topInterests = profile.interests.filter((i) => i.confidence >= MIN).slice(0, 2);
  if (topInterests.length) {
    parts.push(`you're drawn to ${topInterests.map((i) => i.label).join(" and ")}`);
  }

  if (parts.length === 0) {
    return "INNER is starting to notice a few patterns, but nothing clear yet.";
  }

  // Stitch into one soft sentence.
  const sentence = parts.join(", ").replace(/, ([^,]*)$/, ", and $1");
  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + ".";
}

// Convenience: human label for a style value (for compact UI chips).
export function prettyStyleLabel(value: string): string {
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
