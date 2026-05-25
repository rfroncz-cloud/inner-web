export function extractExplicitMemory(message: string): string | null {
    if (!message) return null;
  
    const patterns = [
      /remember that (.+)/i,
      /remember this: (.+)/i,
      /save this: (.+)/i,
      /zapamiętaj że (.+)/i,
      /zapamietaj ze (.+)/i,
      /zapisz że (.+)/i,
      /zapisz ze (.+)/i,
    ];
  
    for (const pattern of patterns) {
      const match = message.match(pattern);
  
      if (match?.[1]) {
        return match[1].trim().replace(/[.!?]+$/g, "");
      }
    }
  
    return null;
  }
  export function normalizeExplicitMemory(memory: string): string {
    let text = memory.trim().replace(/[.!?]+$/g, "");
  
    const lower = text.toLowerCase();
  
    // POLISH
  
    if (lower.startsWith("lubię ")) {
      return `User currently likes ${text.slice(6)}.`;
    }
  
    if (lower.startsWith("lubie ")) {
      return `User currently likes ${text.slice(6)}.`;
    }
  
    if (lower.startsWith("mam ")) {
      return `User has ${text.slice(4)}.`;
    }
  
    if (lower.startsWith("jestem ")) {
      return `User is ${text.slice(7)}.`;
    }
  
    if (lower.startsWith("mieszkam ")) {
      return `User lives ${text.slice(9)}.`;
    }
  
    if (lower.startsWith("boję się ")) {
      return `User fears ${text.slice(8)}.`;
    }
  
    if (lower.startsWith("boje sie ")) {
      return `User fears ${text.slice(9)}.`;
    }
  
    // ENGLISH
  
    if (lower.startsWith("i like ")) {
      return `User currently likes ${text.slice(7)}.`;
    }
  
    if (lower.startsWith("i have ")) {
      return `User has ${text.slice(7)}.`;
    }
  
    if (lower.startsWith("i am ")) {
      return `User is ${text.slice(5)}.`;
    }
  
    if (lower.startsWith("i live in ")) {
      return `User lives in ${text.slice(10)}.`;
    }
  
    if (lower.startsWith("i fear ")) {
      return `User fears ${text.slice(7)}.`;
    }
  
    return `User wants remembered: ${text}.`;
  }