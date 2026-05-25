export type InnerMemory = {
    id?: string;
    memory: string;
    type?: string;
    importance?: number;
    emotional_weight?: number;
    repeat_count?: number;
    relationship_impact?: number;
    category?: string;
    created_at?: string;
    score?: number;
  };
  
  export function calculateMemoryScore(memory: InnerMemory): number {
    const importance = memory.importance ?? 1;
    const emotionalWeight = memory.emotional_weight ?? 1;
    const repeatCount = memory.repeat_count ?? 1;
    const relationshipImpact = memory.relationship_impact ?? 1;
  
    const categoryBoost = getCategoryBoost(memory.category);
    const recencyBoost = getRecencyBoost(memory.created_at);
  
    const score =
      importance * 0.3 +
      emotionalWeight * 0.3 +
      repeatCount * 0.15 +
      relationshipImpact * 0.2 +
      categoryBoost +
      recencyBoost;
  
    return Number(score.toFixed(2));
  }
  
  function getCategoryBoost(category?: string): number {
    switch (category) {
      case "identity":
        return 10;
    
      case "family":
        return 9;
    
      case "birth":
        return 8.5;
    
      case "pet":
        return 8;
    
      case "home":
        return 8;
    
      case "childhood":
        return 8;
    
      case "values":
        return 7.5;
    
      case "relationship":
        return 7;
    
      case "life_event":
        return 7;
    
      case "health":
        return 6.5;
    
      case "emotional":
        return 6;
    
      case "communication":
        return 5.5;
    
      case "boundaries":
        return 5.5;
    
      case "memory":
        return 5.5;
    
      case "finance":
        return 5;
    
      case "work":
        return 4.5;
    
      case "goal":
        return 4;
    
      case "education":
        return 3.5;
    
      case "vehicle":
        return 3;
    
      case "hobby":
        return 2.5;
    
      case "routine":
        return 2.5;
    
      case "fear":
        return 2;
    
      case "preference":
        return 1.5;
    
      default:
        return 0.5;
    }
  }
  
  function getRecencyBoost(createdAt?: string): number {
    if (!createdAt) return 0;
  
    const created = new Date(createdAt).getTime();
    const now = Date.now();
  
    const daysOld = (now - created) / (1000 * 60 * 60 * 24);
  
    if (daysOld < 1) return 1;
    if (daysOld < 7) return 0.7;
    if (daysOld < 30) return 0.4;
    if (daysOld < 90) return 0.2;
  
    return 0;
  }
  
  export function rankMemories(
    memories: InnerMemory[],
    limit = 8
  ): InnerMemory[] {
    return memories
      .map((memory) => ({
        ...memory,
        score: calculateMemoryScore(memory),
      }))
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, limit);
  }
  
  export function memoriesToContext(memories: InnerMemory[]): string {
    if (!memories.length) return "";
  
    return memories
      .map((memory, index) => {
        const score = memory.score ?? calculateMemoryScore(memory);
  
        return `${index + 1}. [${
          memory.category || "memory"
        } | score: ${score}] ${memory.memory}`;
      })
      .join("\n");
  }