// Relationship Pattern Intelligence v2.1
//
// INNER does not just detect single patterns. It combines them into a soft,
// human, non-diagnostic observation. Never use clinical language
// (trauma, disorder, attachment style, depression, anxiety) unless the
// user explicitly used it first.
//
// v2.1 adds relevance scoring: the current user message strongly influences
// which patterns matter *right now*. Older dominant patterns are kept as
// background, not as primary drivers of the reply.

// Legacy union — kept so existing callers and stored memory rows
// (e.g. "overthinking", "identity_confusion") still typecheck.
export type RelationshipPattern =
  | "loneliness"
  | "pressure"
  | "avoidance"
  | "overthinking"
  | "emotional_shutdown"
  | "identity_confusion";

// v2 pattern set used by analyzeRelationshipPatterns.
export type RelationshipPatternType =
  | "avoidance"
  | "loneliness"
  | "pressure"
  | "fear_of_rejection"
  | "trust_issue"
  | "conflict_sensitivity"
  | "emotional_withdrawal"
  | "need_for_reassurance";

export type RelationshipPatternSignal = {
  type: RelationshipPatternType;
  frequency: number;
  frequencyScore: number;
  reinforcementScore: number;
  currentMessageBoost: number;
  relevanceScore: number;
  finalConfidence: number;
  // kept for backwards compatibility — equals finalConfidence
  confidence: number;
  evidence: string[];
};

export type EmotionalTension = {
  patterns: RelationshipPatternType[];
  confidence: number;
  summary: string;
};

export type RelationshipEvolution = {
  pattern: RelationshipPatternType;
  direction: "improving" | "worsening" | "stable" | "conflicting";
  confidence: number;
  summary: string;
};

export type RelationshipPatternProfile = {
  signals: RelationshipPatternSignal[];
  dominantPatterns: RelationshipPatternType[];
  backgroundPatterns: RelationshipPatternType[];
  currentlyRelevantPatterns: RelationshipPatternType[];
  emotionalTensions: EmotionalTension[];
  relationshipEvolution: RelationshipEvolution[];
  summary: string;
  replyHint: string;
};

type MemoryLike = {
  memory?: string;
  type?: string;
  category?: string;
  repeat_count?: number;
  importance?: number;
  emotional_weight?: number;
  created_at?: string;
  last_accessed?: string;
};

const PATTERN_KEYWORDS: Record<RelationshipPatternType, string[]> = {
  avoidance: [
    "avoid",
    "avoiding",
    "pushing people away",
    "push people away",
    "don't reply",
    "dont reply",
    "ignore them",
    "isolating myself",
    "i shut people out",
    "keep my distance",
    "i ghost",
    "ghosted",
    "i back away",
    "unikam",
    "uciekam od",
    "odpycham",
    "izoluję się",
    "izoluje sie",
    "nie odpisuję",
    "nie odpisuje",
    "trzymam dystans",
  ],
  loneliness: [
    "alone",
    "lonely",
    "feel empty around people",
    "empty around people",
    "no one understands",
    "nobody understands",
    "disconnected",
    "isolated",
    "no friends",
    "no one to talk to",
    "i'm alone",
    "i am alone",
    "samotny",
    "samotna",
    "samotność",
    "samotnosc",
    "nikt mnie nie rozumie",
    "czuję się sam",
    "czuje sie sam",
    "odcięty od ludzi",
    "odciety od ludzi",
  ],
  pressure: [
    "pressure",
    "overwhelmed",
    "too much",
    "stressed",
    "exhausted",
    "burned out",
    "burnout",
    "drowning",
    "suffocating",
    "can't breathe",
    "cant breathe",
    "presja",
    "przytłoczony",
    "przytloczony",
    "wyczerpany",
    "wyczerpana",
    "za dużo",
    "za duzo",
    "duszę się",
    "dusze sie",
    "wypalenie",
  ],
  fear_of_rejection: [
    "afraid they'll leave",
    "afraid they will leave",
    "scared of being judged",
    "they'll reject",
    "they will reject",
    "not good enough",
    "not wanted",
    "they'll abandon",
    "they will abandon",
    "fear rejection",
    "afraid of rejection",
    "boję się odrzucenia",
    "boje sie odrzucenia",
    "boję się porzucenia",
    "boje sie porzucenia",
    "nie jestem wystarczający",
    "nie jestem wystarczajaca",
    "odrzucą mnie",
    "odrzuca mnie",
    "opuszczą mnie",
    "opuszcza mnie",
  ],
  trust_issue: [
    "can't trust",
    "cant trust",
    "don't trust",
    "dont trust",
    "trust issues",
    "betrayed",
    "lied to me",
    "broke my trust",
    "deceived",
    "won't open up",
    "wont open up",
    "nie ufam",
    "trudno mi zaufać",
    "trudno mi zaufac",
    "zdradził",
    "zdradzil",
    "zdradzili",
    "oszukali",
    "okłamał",
    "oklamal",
    "stracił zaufanie",
    "stracil zaufanie",
  ],
  conflict_sensitivity: [
    "i hate fighting",
    "i hate conflict",
    "i can't argue",
    "i cant argue",
    "scared of fights",
    "afraid of conflict",
    "shut down in arguments",
    "freeze in fights",
    "tension makes me",
    "nie znoszę kłótni",
    "nie znosze klotni",
    "boję się konfliktu",
    "boje sie konfliktu",
    "uciekam od kłótni",
    "uciekam od klotni",
    "zamykam się w kłótni",
    "zamykam sie w klotni",
  ],
  emotional_withdrawal: [
    "shut down",
    "shutting down",
    "numb",
    "go cold",
    "feel nothing",
    "i go silent",
    "withdraw",
    "withdrew",
    "emotionally distant",
    "i disappear",
    "i check out",
    "zamykam się",
    "zamykam sie",
    "milknę",
    "milkne",
    "odcinam się",
    "odcinam sie",
    "nic nie czuję",
    "nic nie czuje",
    "drętwieję",
    "dretwieje",
    "znikam emocjonalnie",
  ],
  need_for_reassurance: [
    "do you still",
    "are we okay",
    "are we ok",
    "do you care",
    "do you love me",
    "am i enough",
    "tell me you",
    "promise me",
    "i need to know",
    "reassure me",
    "validate me",
    "czy nadal",
    "czy wszystko ok",
    "czy ci zależy",
    "czy ci zalezy",
    "czy mnie kochasz",
    "czy jestem wystarczający",
    "czy jestem wystarczajaca",
    "powiedz że",
    "powiedz ze",
    "potrzebuję wiedzieć",
    "potrzebuje wiedziec",
    "obiecaj mi",
  ],
};

const SINGLE_SUMMARIES: Record<RelationshipPatternType, string> = {
  avoidance:
    "You sometimes seem to step back when things feel too close.",
  loneliness:
    "There may be a quiet loneliness you carry, even when people are around.",
  pressure: "Pressure seems to sit heavier on you than you let on.",
  fear_of_rejection: "Part of you may brace for being pushed away.",
  trust_issue: "Trust may take longer for you than it looks.",
  conflict_sensitivity: "Conflict may land louder for you than it is.",
  emotional_withdrawal: "When feelings rise, you may quietly go inward.",
  need_for_reassurance: "You may need small signs that things are okay.",
};

const SINGLE_HINTS: Record<RelationshipPatternType, string> = {
  avoidance: "Give space without chasing. Do not pull them back too fast.",
  loneliness: "Acknowledge the quiet underneath, not just the surface.",
  pressure: "Lower the volume. One small thing at a time.",
  fear_of_rejection: "Stay steady. Do not perform reassurance.",
  trust_issue: "Be consistent. Avoid grand promises.",
  conflict_sensitivity: "Stay calm in tone. No sudden intensity.",
  emotional_withdrawal: "Do not chase. Hold the space without filling it.",
  need_for_reassurance: "Be present and grounded. Avoid empty validation.",
};

const PAIR_SUMMARIES: Record<string, string> = {
  "avoidance+pressure":
    "You may pull away when pressure gets too close.",
  "loneliness+need_for_reassurance":
    "You seem to want closeness, but you also need signs that it is safe.",
  "fear_of_rejection+trust_issue":
    "You may test people before fully trusting them.",
  "avoidance+loneliness":
    "You may keep distance, even when part of you wants to feel close.",
  "emotional_withdrawal+loneliness":
    "When you go quiet, the loneliness seems to get louder.",
  "conflict_sensitivity+fear_of_rejection":
    "You may stay quiet to avoid being pushed away.",
  "emotional_withdrawal+pressure":
    "When things get heavy, you tend to disappear inside.",
  "need_for_reassurance+trust_issue":
    "You may want closeness, but you also need to feel safe first.",
  "avoidance+fear_of_rejection":
    "You may step back before anyone can leave you first.",
  "conflict_sensitivity+emotional_withdrawal":
    "Tension may make you go quiet rather than push back.",
  "need_for_reassurance+pressure":
    "Under pressure, you may quietly want someone to say it is okay.",
  "fear_of_rejection+need_for_reassurance":
    "You may want to be told you are safe, just to be sure.",
};

const PAIR_HINTS: Record<string, string> = {
  "avoidance+pressure":
    "Do not chase. Make the space feel safe enough to come back to.",
  "loneliness+need_for_reassurance":
    "Stay close in tone, but do not over-promise. Calm presence is enough.",
  "fear_of_rejection+trust_issue":
    "Be steady. Avoid grand statements. Let trust earn itself.",
  "avoidance+loneliness":
    "Acknowledge the pull-away without pushing into it.",
  "emotional_withdrawal+loneliness":
    "Sit beside the quiet. Do not try to fill it too fast.",
  "conflict_sensitivity+fear_of_rejection":
    "Speak softly. Make space for them to disagree without fear.",
  "emotional_withdrawal+pressure":
    "Slow your tone. Do not load them with insight.",
  "need_for_reassurance+trust_issue":
    "Be present and consistent. Avoid empty validation.",
  "avoidance+fear_of_rejection":
    "Do not chase. Let the calm itself be the answer.",
  "conflict_sensitivity+emotional_withdrawal":
    "Hold a calm rhythm. Do not press for resolution.",
  "need_for_reassurance+pressure":
    "Lower intensity. Be the steady voice, not the fix.",
  "fear_of_rejection+need_for_reassurance":
    "Stay grounded. Reassure with presence, not promises.",
};

function pairKey(
  a: RelationshipPatternType,
  b: RelationshipPatternType
): string {
  return [a, b].sort().join("+");
}

// Themes in the *current* message that boost related patterns even when
// no direct keyword match for that pattern is present in the message.
const RELATED_THEMES: ReadonlyArray<{
  keywords: string[];
  boosts: RelationshipPatternType[];
}> = [
  {
    keywords: [
      "closeness",
      "close to me",
      "close to people",
      "attached",
      "attachment",
      "connection",
      "connect with",
      "intimacy",
      "intimate",
      "bliskość",
      "bliskosc",
      "więź",
      "wiez",
      "przywiązanie",
      "przywiazanie",
    ],
    boosts: [
      "fear_of_rejection",
      "emotional_withdrawal",
      "trust_issue",
      "need_for_reassurance",
    ],
  },
  {
    keywords: [
      "pressure",
      "expectation",
      "expectations",
      "demands",
      "demanding",
      "too much",
      "presja",
      "oczekiwania",
      "oczekiwań",
      "oczekiwan",
      "wymagania",
      "za dużo",
      "za duzo",
    ],
    boosts: ["pressure", "avoidance", "emotional_withdrawal"],
  },
  {
    keywords: [
      "lonely",
      "alone",
      "disconnected",
      "samotny",
      "samotna",
      "samotność",
      "samotnosc",
      "odcięty",
      "odciety",
      "odcięta",
      "odcieta",
    ],
    boosts: ["loneliness", "need_for_reassurance", "trust_issue"],
  },
];

const DIRECT_BOOST = 35;
const RELATED_BOOST = 15;
const HISTORY_DECAY_WHEN_NOT_RELEVANT = 0.5;
const DOMINANT_THRESHOLD = 40;
const TENSION_THRESHOLD = 20;
const EVOLUTION_MIN_MEMORIES = 4;
const EVOLUTION_MIN_TOTAL = 2;
const EVOLUTION_STABLE_EPSILON = 0.5;

// All current pattern types are negative-toned. So if a pattern's recent
// frequency is *higher* than older frequency, it's worsening; if it's lower,
// it's improving. If neither side has any matches, no evolution is emitted.
// "conflicting" is reserved for when a pattern's rise lines up with a
// counter-pattern from an active emotional tension also rising.
const IMPROVING_SUMMARIES: Record<RelationshipPatternType, string> = {
  avoidance: "You may be slowly stepping closer to people lately.",
  loneliness: "The loneliness seems to lift a little lately.",
  pressure: "Some of the pressure seems to be easing lately.",
  fear_of_rejection: "You seem slightly less braced for rejection lately.",
  trust_issue: "You may be slowly allowing more trust.",
  conflict_sensitivity:
    "You may handle tension a little more easily lately.",
  emotional_withdrawal:
    "You seem slightly more emotionally present lately.",
  need_for_reassurance: "You seem slightly steadier on your own lately.",
};

const WORSENING_SUMMARIES: Record<RelationshipPatternType, string> = {
  avoidance: "You may be pulling back from people lately.",
  loneliness: "The loneliness seems to be settling in more lately.",
  pressure:
    "It looks like emotional pressure has been building recently.",
  fear_of_rejection: "You seem more braced for rejection lately.",
  trust_issue: "Trust seems harder to extend lately.",
  conflict_sensitivity: "Tension seems to land louder for you lately.",
  emotional_withdrawal: "You seem to be going quieter lately.",
  need_for_reassurance: "You may need a little more reassurance lately.",
};

const STABLE_SUMMARIES: Record<RelationshipPatternType, string> = {
  avoidance: "Your distance from people seems steady lately.",
  loneliness: "The loneliness seems to sit at the same level lately.",
  pressure: "The pressure seems to be holding steady lately.",
  fear_of_rejection: "That careful guarded feeling seems steady lately.",
  trust_issue: "Trust seems to sit in the same place lately.",
  conflict_sensitivity: "How you carry tension seems steady lately.",
  emotional_withdrawal: "How much you open up seems steady lately.",
  need_for_reassurance: "Your need for closeness seems steady lately.",
};

const CONFLICTING_SUMMARY =
  "Some signals appear mixed lately.";

// Emotional tensions describe internal contradictions between two pattern
// families (e.g. wanting closeness while pulling away). They are intentionally
// soft and observational — never diagnostic.
type TensionDefinition = {
  // The first member is the "pull toward" side, the second is the
  // "pull away" or counterforce. Order matters for the summary phrasing.
  patterns: [RelationshipPatternType, RelationshipPatternType];
  // Alternative second-side patterns that also satisfy this tension.
  // Useful when the counterforce can express in multiple ways
  // (e.g. avoidance OR emotional_withdrawal).
  alternates?: RelationshipPatternType[];
  summary: string;
  replyHint: string;
};

const TENSION_DEFINITIONS: TensionDefinition[] = [
  // A) need_for_reassurance + emotional_withdrawal
  {
    patterns: ["need_for_reassurance", "emotional_withdrawal"],
    summary:
      "Part of you seems to need closeness, while another part quietly steps back when it gets too close.",
    replyHint:
      "Stay near without reaching for them. Let them come back at their pace.",
  },
  // B) loneliness + trust_issue
  {
    patterns: ["loneliness", "trust_issue"],
    summary:
      "Part of you may want company, while another part is not sure it is safe yet.",
    replyHint: "Be company without intensity. Quiet presence over reassurance.",
  },
  // C) fear_of_rejection + avoidance
  {
    patterns: ["fear_of_rejection", "avoidance"],
    summary:
      "Part of you may pull back before anyone gets the chance to leave.",
    replyHint: "Do not chase. Steadiness is the reassurance.",
  },
  // D) pressure + closeness-seeking patterns
  {
    patterns: ["need_for_reassurance", "pressure"],
    alternates: ["loneliness"],
    summary:
      "Part of you may want closeness, while another part feels the weight of it.",
    replyHint: "Lower intensity. Closeness without weight.",
  },
  // E) desire_for_connection + fear_of_closeness behavior
  // (connection-seeking expressed as need_for_reassurance/loneliness,
  // fear-of-closeness expressed as emotional_withdrawal/avoidance)
  {
    patterns: ["need_for_reassurance", "emotional_withdrawal"],
    alternates: ["avoidance"],
    summary:
      "Part of you seems to want connection, while another part pulls back when it becomes emotionally real.",
    replyHint:
      "Acknowledge both sides quietly. Do not force the pull-toward.",
  },
];

// Legacy per-message detector. Kept so existing chat route + Supabase rows
// continue to work unchanged.
export function detectRelationshipPatterns(
  message: string
): RelationshipPattern[] {
  const text = (message || "").toLowerCase();
  const patterns: RelationshipPattern[] = [];

  if (
    text.includes("alone") ||
    text.includes("lonely") ||
    text.includes("disconnected") ||
    text.includes("nobody understands") ||
    text.includes("empty around people")
  ) {
    patterns.push("loneliness");
  }

  if (
    text.includes("pressure") ||
    text.includes("overwhelmed") ||
    text.includes("too much") ||
    text.includes("stressed") ||
    text.includes("exhausted")
  ) {
    patterns.push("pressure");
  }

  if (
    text.includes("avoid") ||
    text.includes("pushing people away") ||
    text.includes("don't reply") ||
    text.includes("isolating myself")
  ) {
    patterns.push("avoidance");
  }

  if (
    text.includes("overthinking") ||
    text.includes("can't stop thinking") ||
    text.includes("my thoughts") ||
    text.includes("mind won't stop")
  ) {
    patterns.push("overthinking");
  }

  if (
    text.includes("numb") ||
    text.includes("emotionless") ||
    text.includes("don't feel anything") ||
    text.includes("shut down")
  ) {
    patterns.push("emotional_shutdown");
  }

  if (
    text.includes("who i am") ||
    text.includes("lost myself") ||
    text.includes("don't recognize myself") ||
    text.includes("don't know who i'm becoming")
  ) {
    patterns.push("identity_confusion");
  }

  return [...new Set(patterns)];
}

export function analyzeRelationshipPatterns(
  memories: MemoryLike[],
  currentMessage?: string
): RelationshipPatternProfile {
  const safeMemories = Array.isArray(memories) ? memories : [];
  const currentText = (currentMessage || "").toLowerCase();
  const hasCurrentMessage = currentText.trim().length > 0;

  // Pre-compute current-message boosts per pattern.
  const currentMessageBoostByType: Record<RelationshipPatternType, number> = {
    avoidance: 0,
    loneliness: 0,
    pressure: 0,
    fear_of_rejection: 0,
    trust_issue: 0,
    conflict_sensitivity: 0,
    emotional_withdrawal: 0,
    need_for_reassurance: 0,
  };

  if (hasCurrentMessage) {
    for (const type of Object.keys(
      PATTERN_KEYWORDS
    ) as RelationshipPatternType[]) {
      const direct = PATTERN_KEYWORDS[type].some((kw) =>
        currentText.includes(kw)
      );
      if (direct) {
        currentMessageBoostByType[type] += DIRECT_BOOST;
      }
    }

    for (const theme of RELATED_THEMES) {
      const themeHit = theme.keywords.some((kw) => currentText.includes(kw));
      if (!themeHit) continue;
      for (const type of theme.boosts) {
        currentMessageBoostByType[type] += RELATED_BOOST;
      }
    }
  }

  const signals: RelationshipPatternSignal[] = (
    Object.keys(PATTERN_KEYWORDS) as RelationshipPatternType[]
  ).map((type) => {
    const keywords = PATTERN_KEYWORDS[type];
    let frequency = 0;
    let reinforcement = 0;
    const evidence: string[] = [];

    for (const m of safeMemories) {
      const text = (m.memory || "").toLowerCase();
      if (!text) continue;

      const matched = keywords.some((kw) => text.includes(kw));
      const explicitMatch =
        m.type === "relationship_pattern" && text === type;

      if (matched || explicitMatch) {
        frequency += 1;
        reinforcement += Math.max(0, (m.repeat_count || 1) - 1);
        if (evidence.length < 3 && m.memory) {
          evidence.push(m.memory);
        }
      }
    }

    const frequencyScore = frequency * 22;
    const reinforcementScore = reinforcement * 6;
    const currentMessageBoost = currentMessageBoostByType[type];
    const relevanceScore = currentMessageBoost;

    // Decay older dominance: if we have a current message and *nothing* in
    // it points at this pattern, soften historical scoring so it cannot
    // dominate the reply.
    const historicalMultiplier =
      hasCurrentMessage && relevanceScore === 0
        ? HISTORY_DECAY_WHEN_NOT_RELEVANT
        : 1;

    const finalConfidence = Math.min(
      100,
      Math.round(
        (frequencyScore + reinforcementScore) * historicalMultiplier +
          currentMessageBoost
      )
    );

    return {
      type,
      frequency,
      frequencyScore,
      reinforcementScore,
      currentMessageBoost,
      relevanceScore,
      finalConfidence,
      confidence: finalConfidence,
      evidence,
    };
  });

  const dominantPatterns = signals
    .filter((s) => s.finalConfidence >= DOMINANT_THRESHOLD)
    .sort((a, b) => b.finalConfidence - a.finalConfidence)
    .map((s) => s.type);

  const currentlyRelevantPatterns = signals
    .filter((s) => s.relevanceScore > 0)
    .sort((a, b) => b.finalConfidence - a.finalConfidence)
    .map((s) => s.type);

  const currentlyRelevantSet = new Set(currentlyRelevantPatterns);
  const backgroundPatterns = dominantPatterns.filter(
    (t) => !currentlyRelevantSet.has(t)
  );

  const profile: RelationshipPatternProfile = {
    signals,
    dominantPatterns,
    backgroundPatterns,
    currentlyRelevantPatterns,
    emotionalTensions: [],
    relationshipEvolution: [],
    summary: "",
    replyHint: "",
  };

  profile.emotionalTensions = detectEmotionalTensions(profile);
  console.log("EMOTIONAL_TENSIONS", profile.emotionalTensions);

  profile.relationshipEvolution = detectRelationshipEvolution(
    safeMemories,
    profile
  );
  console.log("RELATIONSHIP_EVOLUTION", profile.relationshipEvolution);

  profile.summary = generatePatternSummary(profile);
  profile.replyHint = getPatternAwareReplyHint(profile);

  return profile;
}

function partitionMemoriesByTime(memories: MemoryLike[]): {
  older: MemoryLike[];
  recent: MemoryLike[];
} {
  if (memories.length < EVOLUTION_MIN_MEMORIES) {
    return { older: [], recent: [] };
  }

  // Sort by created_at ascending. Items without a timestamp are treated as
  // the most recent (they typically come from the current turn / transient
  // pattern detection).
  const ordered = [...memories]
    .map((m, idx) => ({ m, idx }))
    .sort((a, b) => {
      const ta = a.m.created_at ? Date.parse(a.m.created_at) : NaN;
      const tb = b.m.created_at ? Date.parse(b.m.created_at) : NaN;
      const aHas = !Number.isNaN(ta);
      const bHas = !Number.isNaN(tb);
      if (aHas && bHas) return ta - tb;
      if (aHas && !bHas) return -1;
      if (!aHas && bHas) return 1;
      return a.idx - b.idx;
    })
    .map((x) => x.m);

  const mid = Math.floor(ordered.length / 2);
  return {
    older: ordered.slice(0, mid),
    recent: ordered.slice(mid),
  };
}

function countPatternMatches(
  memories: MemoryLike[],
  type: RelationshipPatternType
): number {
  const keywords = PATTERN_KEYWORDS[type];
  let count = 0;
  for (const m of memories) {
    const text = (m.memory || "").toLowerCase();
    if (!text) continue;
    const matched = keywords.some((kw) => text.includes(kw));
    const explicit = m.type === "relationship_pattern" && text === type;
    if (matched || explicit) count += 1;
  }
  return count;
}

export function detectRelationshipEvolution(
  memories: MemoryLike[],
  profile: RelationshipPatternProfile
): RelationshipEvolution[] {
  const safe = Array.isArray(memories) ? memories : [];
  const { older, recent } = partitionMemoriesByTime(safe);

  if (older.length === 0 || recent.length === 0) {
    return [];
  }

  // Pre-compute which patterns are part of an active emotional tension —
  // used to mark a rising pattern as "conflicting" rather than worsening.
  const tensionPatternSet = new Set<RelationshipPatternType>();
  for (const t of profile.emotionalTensions) {
    for (const p of t.patterns) tensionPatternSet.add(p);
  }

  const evolutions: RelationshipEvolution[] = [];

  for (const type of Object.keys(
    PATTERN_KEYWORDS
  ) as RelationshipPatternType[]) {
    const olderCount = countPatternMatches(older, type);
    const recentCount = countPatternMatches(recent, type);
    const total = olderCount + recentCount;

    if (total < EVOLUTION_MIN_TOTAL) continue;

    const olderRate = older.length > 0 ? olderCount / older.length : 0;
    const recentRate = recent.length > 0 ? recentCount / recent.length : 0;
    const delta = recentRate - olderRate;

    let direction: RelationshipEvolution["direction"];
    if (Math.abs(delta) * Math.max(older.length, recent.length) <
        EVOLUTION_STABLE_EPSILON) {
      direction = "stable";
    } else if (delta > 0) {
      direction = "worsening";
    } else {
      direction = "improving";
    }

    // If this pattern is part of an active tension AND it's rising, flag
    // the change as "conflicting" rather than a clean worsening — the
    // signal is moving in opposite directions internally.
    if (direction === "worsening" && tensionPatternSet.has(type)) {
      direction = "conflicting";
    }

    // Confidence: scaled by absolute change magnitude and sample volume.
    const magnitude = Math.abs(delta);
    const sampleBoost = Math.min(20, total * 4);
    const base =
      direction === "stable"
        ? 35
        : Math.min(80, Math.round(magnitude * 100));
    const confidence = Math.min(100, base + sampleBoost);

    let summary = "";
    if (direction === "improving") {
      summary = IMPROVING_SUMMARIES[type];
    } else if (direction === "worsening") {
      summary = WORSENING_SUMMARIES[type];
    } else if (direction === "conflicting") {
      summary = CONFLICTING_SUMMARY;
    } else {
      summary = STABLE_SUMMARIES[type];
    }

    evolutions.push({
      pattern: type,
      direction,
      confidence,
      summary,
    });
  }

  return evolutions.sort((a, b) => b.confidence - a.confidence);
}

export function detectEmotionalTensions(
  profile: RelationshipPatternProfile
): EmotionalTension[] {
  const confidenceByType = new Map<RelationshipPatternType, number>();
  for (const s of profile.signals) {
    confidenceByType.set(s.type, s.finalConfidence);
  }

  // Patterns considered "active" enough to participate in a tension —
  // we keep this softer than the dominant threshold so contradictions can
  // surface even when no single pattern fully dominates.
  const isActive = (type: RelationshipPatternType): boolean =>
    (confidenceByType.get(type) || 0) >= TENSION_THRESHOLD;

  const currentlyRelevantSet = new Set(profile.currentlyRelevantPatterns);
  const tensions: EmotionalTension[] = [];
  const seenKeys = new Set<string>();

  for (const def of TENSION_DEFINITIONS) {
    const [primary, counter] = def.patterns;
    if (!isActive(primary)) continue;

    const counterCandidates: RelationshipPatternType[] = [
      counter,
      ...(def.alternates ?? []),
    ];

    for (const c of counterCandidates) {
      if (!isActive(c)) continue;
      if (c === primary) continue;

      const key = [primary, c].sort().join("+");
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);

      const a = confidenceByType.get(primary) || 0;
      const b = confidenceByType.get(c) || 0;
      let confidence = Math.min(a, b);

      // Prefer tensions where at least one side shows up in the current
      // message — this matches v2.1 relevance behavior.
      if (
        currentlyRelevantSet.has(primary) ||
        currentlyRelevantSet.has(c)
      ) {
        confidence = Math.min(100, confidence + 10);
      }

      tensions.push({
        patterns: [primary, c],
        confidence,
        summary: def.summary,
      });

      break; // only one tension per definition entry
    }
  }

  return tensions.sort((x, y) => y.confidence - x.confidence);
}

function getTensionReplyHint(
  tension: EmotionalTension
): string {
  const key = [...tension.patterns].sort().join("+");
  for (const def of TENSION_DEFINITIONS) {
    const defKey = [...def.patterns].sort().join("+");
    if (defKey === key) return def.replyHint;
    if (def.alternates) {
      for (const alt of def.alternates) {
        const altKey = [def.patterns[0], alt].sort().join("+");
        if (altKey === key) return def.replyHint;
      }
    }
  }
  return "";
}

function getEvolutionReplyHint(evo: RelationshipEvolution): string {
  switch (evo.direction) {
    case "improving":
      return "Acknowledge the small shift quietly. Do not make it a big deal.";
    case "worsening":
      return "Hold space gently. Do not push them to explain it.";
    case "conflicting":
      return "Reflect both sides without trying to resolve them.";
    case "stable":
    default:
      return "Stay present. No need to force anything new.";
  }
}

export function generatePatternSummary(
  profile: RelationshipPatternProfile
): string {
  if (profile.emotionalTensions.length > 0) {
    return profile.emotionalTensions[0].summary;
  }

  if (profile.relationshipEvolution.length > 0) {
    const meaningful = profile.relationshipEvolution.find(
      (e) => e.direction !== "stable"
    );
    if (meaningful) return meaningful.summary;
  }

  const primary =
    profile.currentlyRelevantPatterns.length > 0
      ? profile.currentlyRelevantPatterns
      : profile.dominantPatterns;

  if (primary.length === 0) return "";

  if (primary.length >= 2) {
    const key = pairKey(primary[0], primary[1]);
    if (PAIR_SUMMARIES[key]) return PAIR_SUMMARIES[key];
  }

  // If we have one current pattern and one background pattern, try a pair
  // template, but fall back to single — backgrounds should only colour the
  // reply subtly.
  if (primary.length === 1 && profile.backgroundPatterns.length > 0) {
    const key = pairKey(primary[0], profile.backgroundPatterns[0]);
    if (PAIR_SUMMARIES[key]) return PAIR_SUMMARIES[key];
  }

  return SINGLE_SUMMARIES[primary[0]];
}

export function getPatternAwareReplyHint(
  profile: RelationshipPatternProfile
): string {
  if (profile.emotionalTensions.length > 0) {
    const hint = getTensionReplyHint(profile.emotionalTensions[0]);
    if (hint) return hint;
  }

  if (profile.relationshipEvolution.length > 0) {
    const meaningful = profile.relationshipEvolution.find(
      (e) => e.direction !== "stable"
    );
    if (meaningful) return getEvolutionReplyHint(meaningful);
  }

  const top =
    profile.currentlyRelevantPatterns.length > 0
      ? profile.currentlyRelevantPatterns
      : profile.dominantPatterns;
  if (top.length === 0) return "";

  if (top.length >= 2) {
    const key = pairKey(top[0], top[1]);
    if (PAIR_HINTS[key]) return PAIR_HINTS[key];
  }

  return SINGLE_HINTS[top[0]];
}
