const forgetPatterns = [
    "forget that",
    "forget this",
    "delete this memory",
    "erase that",
    "don't remember this",
    "nie pamiętaj tego",
    "zapomnij to",
    "usuń to z pamięci",
    "nie zapamiętuj tego",
  ];
  
  export function shouldForgetMemory(message: string): boolean {
    if (!message) return false;
  
    const lower = message.toLowerCase();
  
    return forgetPatterns.some((pattern) =>
      lower.includes(pattern)
    );
  }