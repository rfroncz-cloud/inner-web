export type MemoryLike = {
    id?: string;
    memory?: string;
    category?: string;
    type?: string;
    importance?: number;
    repeat_count?: number;
    emotional_weight?: number;
    relationship_impact?: number;
    created_at?: string;
    last_accessed?: string;
  };
  
  const protectedCategories = [
    "identity",
    "family",
    "pet",
    "home",
    "birth",
  ];
  
  const protectedTypes = [
    "core_fact",
  ];
  
  function daysSince(date?: string) {
    if (!date) return 999;
  
    const parsed = new Date(date).getTime();
    const now = Date.now();
  
    return (now - parsed) / (1000 * 60 * 60 * 24);
  }
  
  export function calculateDecay(memory: MemoryLike): number {
    const importance = memory.importance || 1;
    const repeats = memory.repeat_count || 1;
    const emotional = memory.emotional_weight || 1;
    const relationship = memory.relationship_impact || 1;
  
    const createdDays = daysSince(memory.created_at);
    const accessedDays = daysSince(memory.last_accessed);
  
    let score =
      importance * 0.35 +
      repeats * 0.2 +
      emotional * 0.2 +
      relationship * 0.15;
  
    // recently used memories survive longer
    if (accessedDays < 3) score += 15;
    else if (accessedDays < 7) score += 8;
    else if (accessedDays < 30) score += 3;
  
    // newer memories survive slightly longer
    if (createdDays < 7) score += 5;
  
    // protected memories
    if (
      protectedCategories.includes(memory.category || "") ||
      protectedTypes.includes(memory.type || "")
    ) {
      score += 100;
    }
  
    return score;
  }
  
  export function shouldDecayMemory(memory: MemoryLike): boolean {
    const score = calculateDecay(memory);
  
    return score < 18;
  }