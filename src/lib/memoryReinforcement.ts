export type MemoryLike = {
  id?: string;
  memory?: string;
  category?: string;
  importance?: number;
  repeat_count?: number;
  emotional_weight?: number;
  relationship_impact?: number;
};

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .trim();
}

export function findSimilarMemory(
  memories: MemoryLike[],
  text: string
) {
  const normalizedInput = normalize(text);

  return memories.find((memory) => {
    const normalizedMemory = normalize(memory.memory || "");

    if (!normalizedMemory) return false;

    // exact match
    if (normalizedMemory === normalizedInput) {
      return true;
    }

    // partial overlap
    const inputWords = normalizedInput.split(" ");
    const memoryWords = normalizedMemory.split(" ");

    const overlap = inputWords.filter((word) =>
      memoryWords.includes(word)
    ).length;

    return overlap >= 4;
  });
}

export function reinforceMemory(
  memory: MemoryLike
): MemoryLike {
  const repeatCount = (memory.repeat_count || 1) + 1;

  let importance = memory.importance || 1;
  let emotional = memory.emotional_weight || 1;
  let relationship = memory.relationship_impact || 1;

  // repetition increases importance
  if (repeatCount > 2) importance += 1;
  if (repeatCount > 5) importance += 2;
  if (repeatCount > 10) importance += 3;

  // emotional memories strengthen faster
  if (emotional >= 4) importance += 1;

  // relationship-heavy memories strengthen
  if (relationship >= 4) importance += 1;

  // clamp
  importance = Math.min(100, importance);

  return {
    ...memory,
    repeat_count: repeatCount,
    importance,
  };
}