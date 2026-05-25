export type RelationshipPattern =
  | "loneliness"
  | "pressure"
  | "avoidance"
  | "overthinking"
  | "emotional_shutdown"
  | "identity_confusion";

export function detectRelationshipPatterns(message: string) {
  const text = message.toLowerCase();

  const patterns: RelationshipPattern[] = [];

  // loneliness

  if (
    text.includes("alone") ||
    text.includes("lonely") ||
    text.includes("disconnected") ||
    text.includes("nobody understands") ||
    text.includes("empty around people")
  ) {
    patterns.push("loneliness");
  }

  // pressure

  if (
    text.includes("pressure") ||
    text.includes("overwhelmed") ||
    text.includes("too much") ||
    text.includes("stressed") ||
    text.includes("exhausted")
  ) {
    patterns.push("pressure");
  }

  // avoidance

  if (
    text.includes("avoid") ||
    text.includes("pushing people away") ||
    text.includes("don't reply") ||
    text.includes("isolating myself")
  ) {
    patterns.push("avoidance");
  }

  // overthinking

  if (
    text.includes("overthinking") ||
    text.includes("can't stop thinking") ||
    text.includes("my thoughts") ||
    text.includes("mind won't stop")
  ) {
    patterns.push("overthinking");
  }

  // emotional shutdown

  if (
    text.includes("numb") ||
    text.includes("emotionless") ||
    text.includes("don't feel anything") ||
    text.includes("shut down")
  ) {
    patterns.push("emotional_shutdown");
  }

  // identity confusion

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