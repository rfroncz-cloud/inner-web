// Relationship Pattern History v1
//
// Snapshots the relationship state at meaningful moments so evolution
// can be tracked over time. Pure TypeScript — no AI calls.
// Supabase writes are handled in the chat route, not here.

import type { RelationshipStage } from "./relationshipDepthEngine";
import type { RelationshipPatternType } from "./relationshipPatterns";

export type RelationshipSnapshot = {
  user_id: string;
  trust_level: number;
  closeness_level: number;
  attachment_level: number;
  relationship_stage: RelationshipStage;
  emotional_trend: string | null;
  recurring_themes: RelationshipPatternType[];
  interaction_count: number;
  snapshot_reason: SnapshotReason;
  created_at: string;
};

export type SnapshotReason =
  | "stage_change"
  | "trust_band"
  | "daily"
  | "first";

type CurrentState = {
  trust_level: number;
  closeness_level: number;
  attachment_level: number;
  relationship_stage: RelationshipStage;
  interaction_count: number;
  emotional_trend?: string | null;
  recurring_themes?: RelationshipPatternType[];
};

type LastSnapshot = {
  trust_level: number;
  relationship_stage: string;
  created_at: string;
} | null;

// Returns the 10-point band floor a value falls into (0→0, 1-10→10, 11-20→20…)
function trustBand(trust: number): number {
  return Math.floor(Math.max(0, trust) / 10) * 10;
}

export function shouldSnapshotRelationship(
  current: CurrentState,
  last: LastSnapshot
): { should: boolean; reason: SnapshotReason } {
  // No history at all → always snapshot.
  if (!last) {
    return { should: true, reason: "first" };
  }

  // Stage changed.
  if (current.relationship_stage !== last.relationship_stage) {
    return { should: true, reason: "stage_change" };
  }

  // Trust crossed a new 10-point band.
  if (trustBand(current.trust_level) !== trustBand(last.trust_level)) {
    return { should: true, reason: "trust_band" };
  }

  // At most one snapshot per 24 h (daily heartbeat).
  const lastTs = Date.parse(last.created_at);
  const hoursSince = (Date.now() - lastTs) / 3_600_000;
  if (hoursSince >= 24) {
    return { should: true, reason: "daily" };
  }

  return { should: false, reason: "daily" };
}

export function buildRelationshipSnapshot(
  userId: string,
  current: CurrentState
): RelationshipSnapshot {
  return {
    user_id: userId,
    trust_level: current.trust_level,
    closeness_level: current.closeness_level,
    attachment_level: current.attachment_level,
    relationship_stage: current.relationship_stage,
    emotional_trend: current.emotional_trend ?? null,
    recurring_themes: current.recurring_themes ?? [],
    interaction_count: current.interaction_count,
    snapshot_reason: "daily", // overwritten by caller
    created_at: new Date().toISOString(),
  };
}
