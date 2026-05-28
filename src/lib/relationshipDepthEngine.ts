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

// Instructions guide INNER's TONE, not explicit history-citation.
// They must never prompt INNER to say "from your history", "your pattern shows",
// or "because I know you so well". Familiarity shows through warmth and
// precision, not through announcing what it knows.
const STAGE_INSTRUCTIONS: Record<RelationshipStage, string> = {
  new: "Relationship: new. Ask more, assume little. Stay curious; let them reveal things at their own pace.",
  familiar:
    "Relationship: familiar. You have some context on this person. Warmth and continuity are natural; don't make the memory visible.",
  trusted:
    "Relationship: trusted. Speak with honesty and quiet warmth. Subtle emotional precision is welcome; no need to name or cite what you remember.",
  deep: "Relationship: deep. You have real familiarity here. Let that show through tone and emotional accuracy, not through announcing shared history.",
};

export function getRelationshipDepthInstruction(
  stage: RelationshipStage
): string {
  return STAGE_INSTRUCTIONS[stage] ?? STAGE_INSTRUCTIONS.new;
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
