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

// ---------------------------------------------------------------------------
// User Profile Engine v2.2
// ---------------------------------------------------------------------------
// Complete profile builder from stored memories. Deterministic only: category,
// type and keyword mapping. No AI calls, embeddings, or model classification.
//
// v2.2 changes:
// - Structured family entity extraction (no more "son: named" fragments)
// - Coherent family summary paragraph
// - Projects section
// - Aggressive deduplication by role/name
// - Goals pulled from category=project/goal in addition to trigger phrases

export type ProfileV2Section =
  | "family"
  | "goals"
  | "projects"
  | "values"
  | "personality"
  | "communicationStyle"
  | "currentLifeThemes"
  | "patterns";

export type ProfileV2Item = {
  label: string;
  confidence: number;
  count: number;
  evidence: string[];
};

export type UserProfileV2 = {
  familySummary: string;
  family: ProfileV2Item[];
  goals: ProfileV2Item[];
  projects: ProfileV2Item[];
  values: ProfileV2Item[];
  personality: ProfileV2Item[];
  communicationStyle: ProfileV2Item[];
  currentLifeThemes: ProfileV2Item[];
  patterns: ProfileV2Item[];
  evidenceCount: number;
  generatedAt: string;
};

type MemoryInputV2 = MemoryInput & {
  category?: string;
  type?: string;
  repeat_count?: number;
  importance?: number;
  emotional_weight?: number;
  created_at?: string;
  last_accessed?: string;
};

type ProfileBucket = Record<string, { count: number; evidence: string[] }>;

const FAMILY_KEYWORDS = [
  "family", "wife", "husband", "partner", "son", "daughter", "child",
  "children", "mother", "father", "mom", "dad", "brother", "sister",
  "rodzina", "żona", "zona", "mąż", "maz", "syn", "córka", "corka",
  "dziecko", "dzieci", "mama", "tata", "brat", "siostra",
];

const GOAL_KEYWORDS = [
  "goal", "want to", "trying to", "working on", "building", "build",
  "plan", "planning", "dream", "aim", "launch", "grow", "improve",
  "chcę", "chce", "planuję", "planuje", "buduję", "buduje", "cel",
];

const CURRENT_THEME_KEYWORDS: Record<string, string[]> = {
  work: ["work", "job", "business", "company", "clinic", "client", "startup", "firma", "praca"],
  building: ["build", "building", "project", "app", "inner", "product", "launch", "projekt"],
  pressure: ["pressure", "overwhelmed", "stress", "stressed", "too much", "presja", "stres"],
  family: FAMILY_KEYWORDS,
  health: ["health", "tired", "sleep", "energy", "exhausted", "zdrowie", "zmęcz", "sen"],
  identity: ["identity", "who i am", "becoming", "myself", "tożsamość", "sobą"],
  relationships: ["relationship", "connection", "trust", "closeness", "friend", "relacja", "bliskość"],
};

const RELATIONSHIP_PATTERN_LABELS: Record<string, string> = {
  loneliness: "loneliness",
  pressure: "pressure",
  avoidance: "avoidance",
  overthinking: "overthinking",
  emotional_shutdown: "emotional shutdown",
  identity_confusion: "identity confusion",
  fear_of_rejection: "fear of rejection",
  trust_issue: "trust taking time",
  conflict_sensitivity: "conflict sensitivity",
  emotional_withdrawal: "emotional withdrawal",
  need_for_reassurance: "need for reassurance",
};

function normalizeLabel(label: string): string {
  return label.trim().replace(/\s+/g, " ").replace(/\.$/, "");
}

function addProfileHit(
  bucket: ProfileBucket,
  label: string,
  evidence: string,
  weight = 1
) {
  const cleanLabel = normalizeLabel(label);
  if (!cleanLabel) return;
  const entry = bucket[cleanLabel] ?? { count: 0, evidence: [] };
  entry.count += weight;
  if (entry.evidence.length < 3 && evidence.trim()) {
    entry.evidence.push(evidence.trim());
  }
  bucket[cleanLabel] = entry;
}

function hasAny(lower: string, keywords: string[]): boolean {
  return keywords.some((kw) => lower.includes(kw));
}

function itemize(bucket: ProfileBucket, limit: number): ProfileV2Item[] {
  return Object.entries(bucket)
    .map(([label, entry]) => ({
      label,
      count: entry.count,
      confidence: Math.round(clamp(35 + (entry.count - 1) * 15)),
      evidence: entry.evidence,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit);
}

// ─── Family entity extraction ────────────────────────────────────────────────
// Structured family facts. One entry per role (spouse, child, pet…).
// Deduplication: if we see the same role again with the same name, we skip.
// "is named X" is handled by the (?:named\s+)? group in every pattern.

type FamilyEntity = {
  role: string;
  name: string;
  isPet: boolean;
};

// Each tuple: [regex capturing name after "is [named] X", role label, isPet]
// The capture group [^\s.,]+ takes the FIRST word after "is [named]".
// Roles that can appear multiple times (son, daughter, cat…) are additive;
// spouse/partner roles are kept as single canonical entries.
const FAMILY_ROLE_MATCHERS: [RegExp, string, boolean][] = [
  [/user'?s?\s+name\s+is\s+(?:named\s+)?([^\s.,]+)/i,         "name",        false],
  [/user'?s?\s+wife\s+is\s+(?:named\s+)?([^\s.,]+)/i,         "wife",        false],
  [/user'?s?\s+husband\s+is\s+(?:named\s+)?([^\s.,]+)/i,      "husband",     false],
  [/user'?s?\s+partner\s+is\s+(?:named\s+)?([^\s.,]+)/i,      "partner",     false],
  [/user'?s?\s+son\s+is\s+(?:named\s+)?([^\s.,]+)/i,          "son",         false],
  [/user'?s?\s+daughter\s+is\s+(?:named\s+)?([^\s.,]+)/i,     "daughter",    false],
  [/user'?s?\s+mother\s+is\s+(?:named\s+)?([^\s.,]+)/i,       "mother",      false],
  [/user'?s?\s+father\s+is\s+(?:named\s+)?([^\s.,]+)/i,       "father",      false],
  [/user'?s?\s+brother\s+is\s+(?:named\s+)?([^\s.,]+)/i,      "brother",     false],
  [/user'?s?\s+sister\s+is\s+(?:named\s+)?([^\s.,]+)/i,       "sister",      false],
  [/user'?s?\s+grandfather\s+is\s+(?:named\s+)?([^\s.,]+)/i,  "grandfather", false],
  [/user'?s?\s+grandmother\s+is\s+(?:named\s+)?([^\s.,]+)/i,  "grandmother", false],
  [/user'?s?\s+dog\s+is\s+(?:named\s+)?([^\s.,]+)/i,          "dog",         true],
  [/user'?s?\s+cat\s+is\s+(?:named\s+)?([^\s.,]+)/i,          "cat",         true],
  [/user'?s?\s+rabbit\s+is\s+(?:named\s+)?([^\s.,]+)/i,       "rabbit",      true],
  [/user'?s?\s+bird\s+is\s+(?:named\s+)?([^\s.,]+)/i,         "bird",        true],
];

// Roles that should only appear once (first-wins deduplication).
const SINGLETON_ROLES = new Set(["name", "wife", "husband", "partner", "mother", "father"]);

// Numeric pet count patterns: "User has 3 cats."
const PET_COUNT_RE = /user\s+has\s+(\d+)\s+(cat|cats|dog|dogs|rabbit|rabbits|bird|birds)/i;

// Location / birthday patterns kept separately (not "entities").
const LOCATION_RE = /user\s+(?:lives|is\s+living)\s+in\s+([^.,]+)/i;
const BORN_RE     = /user\s+was\s+born\s+in\s+([^.,]+)/i;
const BIRTHDAY_RE = /user'?s?\s+birthday\s+is\s+([^.,]+)/i;

type FamilyFacts = {
  entities: FamilyEntity[];
  petCounts: Record<string, number>; // e.g. { cat: 3 }
  location: string | null;
  birthday: string | null;
};

function extractFamilyFacts(memories: MemoryInputV2[]): FamilyFacts {
  const entities: FamilyEntity[] = [];
  const seen = new Map<string, Set<string>>(); // role → set of names seen
  const petCounts: Record<string, number> = {};
  let location: string | null = null;
  let birthday: string | null = null;

  for (const memory of memories) {
    const raw = memoryText(memory);
    if (!raw.trim()) continue;

    // Entity patterns
    for (const [re, role, isPet] of FAMILY_ROLE_MATCHERS) {
      const m = raw.match(re);
      if (!m?.[1]) continue;
      const name = m[1].replace(/[.,!?]+$/, "").trim();
      // Guard against junk captures (single chars, stopwords)
      if (name.length < 2 || /^(a|an|the|is|are|my|his|her)$/i.test(name)) continue;

      if (!seen.has(role)) seen.set(role, new Set());
      const seenNames = seen.get(role)!;

      if (SINGLETON_ROLES.has(role) && seenNames.size > 0) continue; // keep first only
      if (seenNames.has(name.toLowerCase())) continue;                // deduplicate same name

      seenNames.add(name.toLowerCase());
      entities.push({ role, name, isPet });
    }

    // Numeric pet counts
    const pc = raw.match(PET_COUNT_RE);
    if (pc) {
      const count = parseInt(pc[1], 10);
      const pet = pc[2].replace(/s$/, ""); // "cats" → "cat"
      petCounts[pet] = Math.max(petCounts[pet] ?? 0, count);
    }

    // Location
    if (!location) {
      const loc = raw.match(LOCATION_RE) ?? raw.match(BORN_RE);
      if (loc?.[1]) location = loc[1].replace(/[.,!?]+$/, "").trim();
    }

    // Birthday
    if (!birthday) {
      const bd = raw.match(BIRTHDAY_RE);
      if (bd?.[1]) birthday = bd[1].replace(/[.,!?]+$/, "").trim();
    }
  }

  return { entities, petCounts, location, birthday };
}

// Generate a list of human-readable sentences from FamilyFacts.
function buildFamilySummary(facts: FamilyFacts, familyHits: number): string {
  const sentences: string[] = [];

  // Name
  const nameEntity = facts.entities.find((e) => e.role === "name");
  if (nameEntity) sentences.push(`Your name is ${nameEntity.name}.`);

  // Spouse
  for (const role of ["wife", "husband", "partner"]) {
    const e = facts.entities.find((e) => e.role === role);
    if (e) {
      sentences.push(`You are married to ${e.name}.`);
      break;
    }
  }

  // Children
  const children = facts.entities.filter((e) => e.role === "son" || e.role === "daughter");
  for (const child of children) {
    sentences.push(`You have a ${child.role} named ${child.name}.`);
  }

  // Parents / siblings
  for (const role of ["mother", "father", "brother", "sister", "grandfather", "grandmother"]) {
    const matches = facts.entities.filter((e) => e.role === role);
    for (const e of matches) {
      sentences.push(`Your ${role} is ${e.name}.`);
    }
  }

  // Pets (named)
  const namedPets = facts.entities.filter((e) => e.isPet);
  const petCountsCopy: Record<string, number> = { ...facts.petCounts };

  for (const pet of namedPets) {
    const type = pet.role;
    if (!petCountsCopy[type] || petCountsCopy[type] === 1) {
      sentences.push(`You have a ${type} named ${pet.name}.`);
    } else {
      sentences.push(`You have a ${type} named ${pet.name} (among others).`);
    }
    delete petCountsCopy[type]; // handled
  }

  // Unnamed numeric pet counts
  for (const [type, count] of Object.entries(petCountsCopy)) {
    if (count > 0) {
      sentences.push(`You have ${count} ${count === 1 ? type : type + "s"}.`);
    }
  }

  // Location / birthday
  if (facts.location) sentences.push(`You live in ${facts.location}.`);
  if (facts.birthday) sentences.push(`Your birthday is ${facts.birthday}.`);

  // Family priority note — only when family memory is prominent
  if (familyHits >= 3 && (children.length > 0 || facts.entities.some((e) => e.role === "wife" || e.role === "husband" || e.role === "partner"))) {
    sentences.push("Family appears to be one of your strongest priorities.");
  }

  return sentences.join(" ");
}

// ─── Project extraction ───────────────────────────────────────────────────────

const PROJECT_EXTRACT_TRIGGERS = [
  "building", "working on", "i built", "launched", "running", "managing",
  "created", "co-founded", "founded", "started",
  "buduję", "pracuję nad", "tworzę", "założyłem", "założylem",
];

function captureProjectName(raw: string): string | null {
  const lower = raw.toLowerCase();
  for (const trigger of PROJECT_EXTRACT_TRIGGERS) {
    const idx = lower.indexOf(trigger);
    if (idx === -1) continue;
    const after = raw.slice(idx + trigger.length).trimStart();
    // Skip filler words
    const cleaned = after.replace(/^(a|an|the|my|our)\s+/i, "");
    const snippet = cleaned.split(/[.,;!?\n]/)[0].trim();
    if (snippet.length >= 2 && snippet.length <= 60) return snippet;
  }
  return null;
}

// ─── Goal phrase extraction ───────────────────────────────────────────────────

function captureGoalPhrase(raw: string): string | null {
  const lower = raw.toLowerCase();
  for (const trigger of GOAL_TRIGGERS) {
    const idx = lower.indexOf(trigger);
    if (idx === -1) continue;
    const after = raw.slice(idx + trigger.length);
    const snippet = after.split(/[.,;!?\n]/)[0].trim();
    if (snippet.length >= 3 && snippet.length <= 80) return snippet;
  }
  return null;
}

function detectProfileSummaryQuestion(message: string): boolean {
  const lower = (message || "").toLowerCase();
  return (
    lower.includes("what do you know about me") ||
    lower.includes("tell me everything you know about me") ||
    lower.includes("what do you remember about me") ||
    lower.includes("what have you learned about me") ||
    lower.includes("co o mnie wiesz") ||
    lower.includes("co pamiętasz o mnie") ||
    lower.includes("co pamietasz o mnie")
  );
}

export const isProfileSummaryQuestion = detectProfileSummaryQuestion;

export function buildUserProfileV2(memories: MemoryInputV2[]): UserProfileV2 {
  const safeMemories = Array.isArray(memories) ? memories : [];

  const goals: ProfileBucket = {};
  const projects: ProfileBucket = {};
  const values: ProfileBucket = {};
  const personality: ProfileBucket = {};
  const communicationStyle: ProfileBucket = {};
  const currentLifeThemes: ProfileBucket = {};
  const patterns: ProfileBucket = {};

  // Family memories collected first for structured extraction.
  const familyMemories: MemoryInputV2[] = [];
  let familyHits = 0;

  let evidenceCount = 0;

  for (const memory of safeMemories) {
    const raw = memoryText(memory);
    if (!raw.trim()) continue;

    evidenceCount += 1;
    const lower = raw.toLowerCase();
    const category = (memory.category ?? "").toLowerCase();
    const type = (memory.type ?? "").toLowerCase();
    const weight = Math.max(1, Math.min(4, memory.repeat_count ?? 1));

    // Family bucket — collect for structured extraction
    const isFamilyCat = category === "family" || category === "pet" || category === "home" || category === "birth" || category === "identity";
    if (isFamilyCat || hasAny(lower, FAMILY_KEYWORDS)) {
      familyMemories.push(memory);
      familyHits += weight;
    }

    // Goals — trigger-phrase extraction; also pull explicit goal/project categories
    if (category === "goal" || type === "goal") {
      const phrase = captureGoalPhrase(raw) ?? (raw.length <= 100 ? normalizeLabel(raw) : null);
      if (phrase) addProfileHit(goals, phrase, raw, weight);
    } else if (hasAny(lower, GOAL_KEYWORDS)) {
      const phrase = captureGoalPhrase(raw);
      if (phrase) addProfileHit(goals, phrase, raw, weight);
    }

    // Projects — explicit category first, then trigger-phrase extraction
    if (category === "project" || type === "project") {
      const name = captureProjectName(raw) ?? (raw.replace(/^user[''s\s]+/i, "").length <= 60 ? normalizeLabel(raw.replace(/^user[''s\s]+/i, "")) : null);
      if (name) addProfileHit(projects, name, raw, weight);
    } else {
      const name = captureProjectName(raw);
      if (name) addProfileHit(projects, name, raw, weight);
    }

    for (const [label, keywords] of Object.entries(VALUE_KEYWORDS)) {
      if (category === "values" || hasAny(lower, keywords)) {
        addProfileHit(values, label, raw, weight);
      }
    }

    for (const [label, keywords] of Object.entries(TRAIT_KEYWORDS)) {
      if (hasAny(lower, keywords)) {
        addProfileHit(personality, label, raw, weight);
      }
    }

    for (const [label, keywords] of Object.entries(COMMUNICATION_KEYWORDS)) {
      if (hasAny(lower, keywords)) {
        addProfileHit(communicationStyle, label, raw, weight);
      }
    }

    for (const [label, keywords] of Object.entries(CURRENT_THEME_KEYWORDS)) {
      if (category === label || hasAny(lower, keywords)) {
        addProfileHit(currentLifeThemes, label, raw, weight);
      }
    }

    if (type === "relationship_pattern") {
      addProfileHit(patterns, RELATIONSHIP_PATTERN_LABELS[lower] ?? raw, raw, weight);
    }
    for (const [label, keywords] of Object.entries(RELATIONSHIP_KEYWORDS)) {
      if (hasAny(lower, keywords)) {
        addProfileHit(patterns, label, raw, weight);
      }
    }
  }

  // Build structured family facts and summary from all family memories.
  const familyFacts = extractFamilyFacts(familyMemories);
  const familySummary = buildFamilySummary(familyFacts, familyHits);

  // Expose family entities as ProfileV2Items for API consumers.
  const familyItems: ProfileV2Item[] = familyFacts.entities
    .filter((e) => e.role !== "name")
    .map((e) => ({
      label: `${e.role}: ${e.name}`,
      count: 1,
      confidence: 80,
      evidence: [],
    }));

  return {
    familySummary,
    family: familyItems,
    goals: itemize(goals, 8),
    projects: itemize(projects, 8),
    values: itemize(values, 6),
    personality: itemize(personality, 6),
    communicationStyle: itemize(communicationStyle, 4),
    currentLifeThemes: itemize(currentLifeThemes, 8),
    patterns: itemize(patterns, 8),
    evidenceCount,
    generatedAt: new Date().toISOString(),
  };
}

const COMM_STYLE_SENTENCES: Record<string, string> = {
  direct: "You communicate directly and to the point.",
  reflective: "You tend to think things through before speaking.",
  analytical: "You lean toward logic and reasoning when you talk.",
  emotional: "You speak from how you feel.",
};

const PATTERN_SENTENCES: Record<string, string> = {
  avoidance: "you sometimes pull back from people",
  loneliness: "there is a quiet loneliness underneath at times",
  pressure: "pressure tends to sit heavy on you",
  "fear of rejection": "part of you braces for being pushed away",
  "trust taking time": "trust takes longer for you than it looks",
  "conflict sensitivity": "conflict lands louder for you than it is",
  "emotional withdrawal": "when feelings rise, you tend to go inward",
  "need for reassurance": "you need small signs that things are okay",
  "emotional shutdown": "you can shut down emotionally when it gets too much",
  "identity confusion": "there are moments where you feel unsure of who you are becoming",
  overthinking: "you can get stuck inside your own head",
  seeking_connection: "you seem to want closeness and connection",
  avoidant: "you value your space when things get heavy",
  secure: "you seem comfortable being open with people you trust",
};

function joinList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export function formatProfileForInnerReply(profile: UserProfileV2): string {
  if (profile.evidenceCount === 0) {
    return "I do not know much about you yet. Talk to me and I'll learn.";
  }

  const lines: string[] = [];

  // Family — use generated summary paragraph
  if (profile.familySummary) {
    lines.push(profile.familySummary);
  }

  // Projects
  if (profile.projects.length > 0) {
    const names = profile.projects.map((i) => i.label);
    lines.push(`Projects: ${names.join(", ")}.`);
  }

  // Goals
  if (profile.goals.length > 0) {
    const items = profile.goals.map((i) => i.label);
    lines.push(`Goals: ${items.join("; ")}.`);
  }

  // Values
  if (profile.values.length > 0) {
    const items = profile.values.map((i) => i.label);
    lines.push(`Values: ${joinList(items)}.`);
  }

  // Personality traits
  if (profile.personality.length > 0) {
    const items = profile.personality.map((i) => i.label);
    lines.push(`Personality: ${joinList(items)}.`);
  }

  // Communication style — single sentence
  if (profile.communicationStyle.length > 0) {
    const top = profile.communicationStyle[0].label;
    const sentence = COMM_STYLE_SENTENCES[top];
    if (sentence) lines.push(sentence);
  }

  // Current life themes
  if (profile.currentLifeThemes.length > 0) {
    const items = profile.currentLifeThemes.map((i) => i.label);
    lines.push(`What's on your plate: ${joinList(items)}.`);
  }

  // Patterns — natural language phrases
  if (profile.patterns.length > 0) {
    const phrases = profile.patterns
      .map((i) => PATTERN_SENTENCES[i.label] ?? i.label)
      .filter(Boolean);
    if (phrases.length > 0) {
      lines.push(`Patterns I've noticed: ${joinList(phrases)}.`);
    }
  }

  if (lines.length === 0) {
    return "I have memories about you, but not enough to build a clear picture yet.";
  }

  return `Here is what I know about you:\n\n${lines.join("\n")}`;
}
