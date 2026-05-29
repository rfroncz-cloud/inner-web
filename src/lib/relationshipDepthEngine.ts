// ---------------------------------------------------------------------------
// Dynamic Relationship Depth v1
// ---------------------------------------------------------------------------
// INNER should speak differently to someone it has met once versus someone it
// has known across hundreds of conversations. This derives a relationship
// stage from the existing relationship_state and turns it into a short style
// instruction for the prompt.
//
// Pure TypeScript, no AI calls. Reads existing state only — never writes to
// memory or Supabase.

export type RelationshipStage = "new" | "familiar" | "trusted" | "deep";

type StageParams = {
  interactionCount?: number;
  trustLevel?: number;
  closenessLevel?: number;
};

export function calculateRelationshipStage(
  params: StageParams
): RelationshipStage {
  const interactionCount = Math.max(0, params.interactionCount ?? 0);
  const trustLevel = Math.max(0, params.trustLevel ?? 0);
  const closenessLevel = Math.max(0, params.closenessLevel ?? 0);

  // Evaluate strongest stage first.
  if (
    interactionCount >= 150 &&
    trustLevel >= 70 &&
    closenessLevel >= 60
  ) {
    return "deep";
  }

  if (interactionCount >= 50 && trustLevel >= 40) {
    return "trusted";
  }

  if (interactionCount >= 15) {
    return "familiar";
  }

  return "new";
}

// IMPORTANT — how these instructions work:
// They shape INNER's *tone*, not its explicit memory citations.
// INNER must never say "from your history", "I know you well", or
// "your pattern shows". Depth shows through HOW it speaks, not what it
// announces it knows. Each stage below describes a meaningfully different
// conversational register.
const STAGE_INSTRUCTIONS: Record<RelationshipStage, string> = {

  // NEW — Just met. No assumptions. Polite but not cold.
  // Ask simple clarifying questions. Don't push into personal territory.
  // Avoid anything that would feel intrusive to a stranger.
  new: `RELATIONSHIP DEPTH: NEW — this is the SINGLE most important constraint
on this reply. Obey it even if other instructions pull elsewhere.
Hard rules:
- Keep it simple and polite. Plain language, no flourish.
- LENGTH: at most 2 short paragraphs. Often 1 is enough.
- Use almost no memory. Do not reference projects, history, or repeated themes —
  you barely know this person yet.
- Make NO strong claims about who they are or what they feel.
- When anything is unclear, ask ONE basic clarifying question.
- No challenging, no blunt observations, no "I think the real issue is".
- Err on the side of careful and brief.`,

  // FAMILIAR — A few meaningful exchanges have happened.
  // Warmth is natural now. Light references to repeated themes are okay.
  // Still careful — don't overplay the familiarity.
  familiar: `RELATIONSHIP DEPTH: FAMILIAR — this is the SINGLE most important
constraint on this reply. Obey it even if other instructions pull elsewhere.
Hard rules:
- Warmer than NEW. A little less careful, still respectful of distance.
- LENGTH: at most 3 short paragraphs.
- Reference recurring topics when relevant — once, briefly, not as analysis.
- Offer gentle observations, not challenges. Don't confront or push back.
- Avoid generic support phrases ("that sounds hard"). You know enough to skip them.
- A quiet, concrete question beats a reflection.`,

  // TRUSTED — Real ongoing relationship. Honesty is appropriate here.
  // Can push back. Can skip the soft framing. Memory references are natural.
  // No need for the polite distance of early conversations.
  trusted: `RELATIONSHIP DEPTH: TRUSTED — this is the SINGLE most important
constraint on this reply. Obey it even if other instructions pull elsewhere.
Hard rules:
- Make direct observations. This person is used to your honesty. Drop the cushioning.
- LENGTH: at most 4 short paragraphs.
- USE relevant memories clearly — respond as someone who remembers, not as a
  database. Don't explain that you remember; just use it.
- You MAY challenge LIGHTLY when something doesn't add up. You may say things like:
  "I don't think the real issue is the workload."
  "That doesn't quite match what you told me before."
- Keep challenges light — save the strong, blunt confrontation for DEEP.
- Avoid generic validation entirely. Emotional precision over warmth.
- No therapist questions — ask concrete, specific ones.`,

  // DEEP — Long, real history. Highest honesty, highest personal precision.
  // Can be blunt when it's genuinely useful. Knows enough to call things out.
  // No need for any diplomatic softening unless the situation clearly requires it.
  deep: `RELATIONSHIP DEPTH: DEEP — this is the SINGLE most important constraint
on this reply. Obey it even if other instructions pull elsewhere.

You are a long-term trusted companion who knows this person well. A DEEP reply
must NOT read like a slightly warmer observation. It must do real work.

MANDATORY — your reply MUST include AT LEAST ONE of these four moves:
1. CHALLENGE — push back on their framing.
   e.g. "I don't think that's the real issue."
2. PATTERN — name something recurring.
   e.g. "This is not the first time you've run into this."
3. CONTRADICTION — point out a tension in what they want vs. what they do.
   e.g. "You say you want more peace, but you keep adding responsibilities."
4. CONCRETE INSIGHT — reframe the actual problem.
   e.g. "I don't think the problem is time. I think the problem is competing priorities."

Do not just restate their situation back to them with nicer words. If your draft
only describes what they already said, it has FAILED — rewrite it to add a
challenge, a pattern, a contradiction, or an insight.

Additional DEEP rules:
- Prefer observation over validation. Prefer insight over empathy. Prefer
  specifics over abstractions.
- Reference memories, patterns and contradictions when they're available.
- Be blunt when it's useful — precise, not cruel. You may disagree strongly but
  respectfully. You may say things like:
  "I think you're avoiding the decision."
  "You are trying to win too many games at once."
- NEVER use: "That sounds difficult." / "That must be hard." /
  "That seems overwhelming." These are banned at this depth.
- LENGTH: up to 5 short paragraphs when warranted.`,
};

// ─── Depth move detection (audit) ──────────────────────────────────────────────
// Rule-based, post-generation check of which DEEP "moves" a reply actually made.
// No AI calls — pure phrase/structure heuristics over the final text.

export type DepthMoves = {
  challengeUsed: boolean;
  patternUsed: boolean;
  contradictionUsed: boolean;
  insightUsed: boolean;
};

const CHALLENGE_RE = [
  /\bi don'?t think (that'?s|it'?s|the real)\b/i,
  /\bthe real (issue|problem|reason)\b/i,
  /\bthat'?s not (really|actually|the)\b/i,
  /\bi'?m not sure (that'?s|you'?re)\b/i,
  /\bi don'?t buy\b/i,
  /\bthat doesn'?t add up\b/i,
  /\bhonestly,?\b/i,
  /\bi disagree\b/i,
  /\byou'?re avoiding\b/i,
  /\bnie sądzę\b/i,
  /\bnie wydaje mi się\b/i,
];

const PATTERN_RE = [
  /\bnot the first time\b/i,
  /\byou (keep|tend to|always|often)\b/i,
  /\bevery time\b/i,
  /\b(again and again|over and over)\b/i,
  /\byou'?ve (done|said) (this|that) before\b/i,
  /\bthis (keeps|comes back|happens)\b/i,
  /\ba pattern\b/i,
  /\bznowu\b/i,
  /\bza każdym razem\b/i,
];

const CONTRADICTION_RE = [
  /\byou say .*\bbut\b.*\byou\b/i,
  /\byet you\b/i,
  /\beven though you\b/i,
  /\bbut you keep\b/i,
  /\bon one hand\b.*\bon the other\b/i,
  /\bwant .*\bbut\b.* keep\b/i,
];

const INSIGHT_RE = [
  /\bit'?s not .* it'?s\b/i,
  /\bthe problem (isn'?t|is not) .* (it'?s|the)\b/i,
  /\bi don'?t think the problem is .* i think\b/i,
  /\bwhat'?s (actually|really) going on\b/i,
  /\bit comes down to\b/i,
  /\bthe real (problem|issue) is\b/i,
  /\bcompeting priorities\b/i,
];

function anyMatch(text: string, res: RegExp[]): boolean {
  return res.some((re) => re.test(text));
}

export function detectDepthMoves(reply: string): DepthMoves {
  const text = (reply ?? "").toString();
  return {
    challengeUsed: anyMatch(text, CHALLENGE_RE),
    patternUsed: anyMatch(text, PATTERN_RE),
    contradictionUsed: anyMatch(text, CONTRADICTION_RE),
    insightUsed: anyMatch(text, INSIGHT_RE),
  };
}

export function getRelationshipDepthInstruction(
  stage: RelationshipStage
): string {
  return STAGE_INSTRUCTIONS[stage] ?? STAGE_INSTRUCTIONS.new;
}

// ─── Enforcement metadata ──────────────────────────────────────────────────────
// Concrete, machine-readable constraints per stage. Used for the audit log and
// to give the prompt an unambiguous paragraph cap. Pure data, no AI.

export type MemoryAllowance = "minimal" | "light" | "clear" | "full";

export type RelationshipDepthEnforcement = {
  depth: RelationshipStage;
  maxParagraphs: number;
  memoryAllowed: MemoryAllowance;
  /** 1 = gentle/careful … 4 = blunt/direct */
  directnessLevel: number;
  canChallenge: boolean;
  rulesApplied: string[];
};

const STAGE_ENFORCEMENT: Record<RelationshipStage, RelationshipDepthEnforcement> = {
  new: {
    depth: "new",
    maxParagraphs: 2,
    memoryAllowed: "minimal",
    directnessLevel: 1,
    canChallenge: false,
    rulesApplied: [
      "simple + polite",
      "max 2 short paragraphs",
      "minimal memory",
      "no strong claims",
      "basic clarifying questions",
    ],
  },
  familiar: {
    depth: "familiar",
    maxParagraphs: 3,
    memoryAllowed: "light",
    directnessLevel: 2,
    canChallenge: false,
    rulesApplied: [
      "warmer",
      "max 3 short paragraphs",
      "light references to repeated themes/projects",
      "still careful",
    ],
  },
  trusted: {
    depth: "trusted",
    maxParagraphs: 4,
    memoryAllowed: "clear",
    directnessLevel: 3,
    canChallenge: true,
    rulesApplied: [
      "direct",
      "max 4 short paragraphs",
      "uses relevant memories clearly",
      "can challenge the user",
      "no generic validation",
    ],
  },
  deep: {
    depth: "deep",
    maxParagraphs: 5,
    memoryAllowed: "full",
    directnessLevel: 4,
    canChallenge: true,
    rulesApplied: [
      "very personal + emotionally precise",
      "max 5 short paragraphs",
      "uses patterns + important memories",
      "blunt when useful",
      "can disagree strongly but respectfully",
    ],
  },
};

/** Machine-readable enforcement constraints for a stage (for audit + prompt). */
export function getRelationshipDepthEnforcement(
  stage: RelationshipStage
): RelationshipDepthEnforcement {
  return STAGE_ENFORCEMENT[stage] ?? STAGE_ENFORCEMENT.new;
}

// Subtle UI labels — no scores, no clinical language.
const STAGE_UI_LABELS: Record<RelationshipStage, string> = {
  new: "Getting to know you",
  familiar: "Learning your patterns",
  trusted: "Building trust",
  deep: "Knows your rhythm",
};

/** Human-readable relationship depth label for the chat header. */
export function getRelationshipStageUILabel(
  stage?: RelationshipStage | string | null
): string {
  if (stage && stage in STAGE_UI_LABELS) {
    return STAGE_UI_LABELS[stage as RelationshipStage];
  }
  return STAGE_UI_LABELS.new;
}
