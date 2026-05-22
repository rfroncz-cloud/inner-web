export type InnerMemory = {
    type?: string;
    memory?: string;
    importance?: number;
  };
  
  export function compressMemories(
    memories: InnerMemory[] = []
  ): string {
    if (!Array.isArray(memories) || memories.length === 0) {
      return "No long term memories yet.";
    }
  
    const sorted = [...memories]
      .filter((m) => m?.memory)
      .sort((a, b) => (b.importance ?? 50) - (a.importance ?? 50))
      .slice(0, 4);
  
    return `
  Relevant long term memories:
  ${sorted
    .map((m) => {
      const type = m.type || "general";
      const importance = m.importance ?? 50;
      return `- [${type} | importance ${importance}] ${m.memory}`;
    })
    .join("\n")}
  `;
  }
  
  export function compressUserProfile(
    userProfile: string[] = []
  ): string {
    if (!Array.isArray(userProfile) || userProfile.length === 0) {
      return "No stable user profile yet.";
    }
  
    return `
  Stable user profile:
  ${userProfile.slice(0, 10).map((p) => `- ${p}`).join("\n")}
  `;
  }
  
  export function compressRecentMessages(messages: any[] = []) {
    if (!Array.isArray(messages)) return [];
  
    return messages.slice(-6);
  }
  export function calculateMemoryImportance(text: string): number {
    const lower = text.toLowerCase();
  
    let score = 30;
  
    const highImportanceWords = [
        "cel",
        "biznes",
        "boję",
        "stres",
        "pamiętaj",
        "marzenie",
        "problem",
      ];
    for (const word of highImportanceWords) {
      if (lower.includes(word)) score += 10;
    }
  
    if (text.length > 120) score += 10;
    if (text.length > 300) score += 15;
  
    return Math.min(score, 100);
  }
  
  export function shouldSaveMemory(text: string): boolean {
    return calculateMemoryImportance(text) >= 50;
  }
  export type MemoryType =
  | "goal"
  | "fear"
  | "business"
  | "relationship"
  | "identity"
  | "preference"
  | "technical"
  | "general";

export function classifyMemoryType(text: string): MemoryType {
  const lower = text.toLowerCase();

  if (
    lower.includes("cel") ||
    lower.includes("chcę") ||
    lower.includes("planuję") ||
    lower.includes("marzenie")
  ) {
    return "goal";
  }

  if (
    lower.includes("boję") ||
    lower.includes("stres") ||
    lower.includes("lęk") ||
    lower.includes("martwię")
  ) {
    return "fear";
  }

  if (
    lower.includes("firma") ||
    lower.includes("biznes") ||
    lower.includes("startup") ||
    lower.includes("zarabiać") ||
    lower.includes("klient")
  ) {
    return "business";
  }

  if (
    lower.includes("żona") ||
    lower.includes("partner") ||
    lower.includes("rodzina") ||
    lower.includes("relacja")
  ) {
    return "relationship";
  }

  if (
    lower.includes("jestem") ||
    lower.includes("mam tendencję") ||
    lower.includes("lubię") ||
    lower.includes("nie lubię")
  ) {
    return "identity";
  }

  if (
    lower.includes("wolę") ||
    lower.includes("preferuję") ||
    lower.includes("od teraz") ||
    lower.includes("zawsze odpowiadaj")
  ) {
    return "preference";
  }

  if (
    lower.includes("cursor") ||
    lower.includes("next.js") ||
    lower.includes("react") ||
    lower.includes("api") ||
    lower.includes("kod")
  ) {
    return "technical";
  }

  return "general";
}
export function normalizeMemoryText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, "")
      .replace(/\s+/g, " ")
      .trim();
  }
  
  export function isSimilarMemory(
    existingMemory: string,
    newMemory: string
  ): boolean {
    const a = normalizeMemoryText(existingMemory);
    const b = normalizeMemoryText(newMemory);
  
    if (!a || !b) return false;
  
    if (a === b) return true;
    if (a.includes(b) || b.includes(a)) return true;
  
    const aWords = new Set(a.split(" "));
    const bWords = new Set(b.split(" "));
  
    const sharedWords = [...aWords].filter((word) =>
      bWords.has(word)
    );
  
    const similarity =
      sharedWords.length /
      Math.max(aWords.size, bWords.size);
  
    return similarity >= 0.65;
  }
  
  export function mergeMemoryLists(
    existingMemories: InnerMemory[] = [],
    newMemory: InnerMemory
  ): InnerMemory[] {
    const index = existingMemories.findIndex((memory) =>
      isSimilarMemory(memory.memory || "", newMemory.memory || "")
    );
  
    if (index === -1) {
      return [...existingMemories, newMemory];
    }
  
    return existingMemories.map((memory, i) => {
      if (i !== index) return memory;
  
      return {
        ...memory,
        ...newMemory,
        importance: Math.max(
          memory.importance ?? 50,
          newMemory.importance ?? 50
        ),
      };
    });
  }
  export function getRelevantMemories(
    memories: InnerMemory[] = [],
    userMessage: string = "",
    limit = 4
  ): InnerMemory[] {
    if (!Array.isArray(memories) || !userMessage) return [];
  
    const words = userMessage
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, "")
      .split(/\s+/)
      .filter((word) => word.length > 4);
  
    if (words.length === 0) return [];
  
    return memories
      .filter((memory) => {
        const text = memory.memory?.toLowerCase() || "";
  
        return words.some((word) => text.includes(word));
      })
      .sort(
        (a, b) =>
          (b.importance ?? 50) - (a.importance ?? 50)
      )
      .slice(0, limit);
  }