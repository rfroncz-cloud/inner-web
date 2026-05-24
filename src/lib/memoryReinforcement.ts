export function findSimilarMemory(
    memories: any[],
    newMessage: string
  ) {
    const text = newMessage.toLowerCase();
  
    return memories.find((memory) => {
      const existing = (memory.memory || "").toLowerCase();
  
      if (!existing) return false;
  
      const sharedWords = text
        .split(" ")
        .filter(
          (word) =>
            word.length > 4 &&
            existing.includes(word)
        );
  
      return sharedWords.length >= 3;
    });
  }