export function shouldDeleteMemory(memory: any): boolean {
    const text = (memory.memory || "").toLowerCase();
  
    const lowValuePatterns = [
      "jak mam na imię",
      "jak mam na imie",
      "what is my name",
      "what's my name",
      "która godzina",
      "ktora godzina",
      "jaka jest data",
      "jaki dziś dzień",
      "jaki dzis dzien",
      "go deeper",
      "deep analysis",
      "analyze this",
      "test",
      "xd",
      "lol",
      "hej",
      "hello",
      "hi",
    ];
  
    const matchesLowValue = lowValuePatterns.some(
      (pattern) => text.includes(pattern)
    );
  
    const lowImportance = (memory.importance || 0) < 35;
    const lowRepeat = (memory.repeat_count || 0) <= 1;
  
    return (
      matchesLowValue ||
      (memory.category === "other" &&
        lowImportance &&
        lowRepeat)
    );
  }