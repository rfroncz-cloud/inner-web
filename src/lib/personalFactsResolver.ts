export function resolvePersonalFact(
  userMessage: string,
  memories: any[]
): string | null {
  const lower = userMessage.toLowerCase();

  const findMemory = (search: string) =>
    memories.find((m: any) =>
      m.memory?.toLowerCase().includes(search)
    );

  // NAME
  if (
    lower.includes("what is my name") ||
    lower.includes("what's my name") ||
    lower.includes("jak mam na imię") ||
    lower.includes("jak mam na imie")
  ) {
    const memory = findMemory("user's name is");

    if (memory) {
      const match = memory.memory.match(/User's name is (.+)\./i);

      if (match?.[1]) {
        return `Your name is ${match[1]}.`;
      }
    }
  }

  // WIFE
  if (
    lower.includes("wife") ||
    lower.includes("żona") ||
    lower.includes("zona")
  ) {
    const memory = findMemory("user's wife is");

    if (memory) {
      const match = memory.memory.match(/User's wife is (.+)\./i);

      if (match?.[1]) {
        return `Your wife's name is ${match[1]}.`;
      }
    }
  }

  // SON
  if (
    lower.includes("son") ||
    lower.includes("syn")
  ) {
    const memory = findMemory("user's son is");

    if (memory) {
      const match = memory.memory.match(/User's son is (.+)\./i);

      if (match?.[1]) {
        return `Your son's name is ${match[1]}.`;
      }
    }
  }

  // DOG
  if (
    lower.includes("dog") ||
    lower.includes("pies")
  ) {
    const memory = findMemory("user's dog is");

    if (memory) {
      const match = memory.memory.match(/User's dog is (.+)\./i);

      if (match?.[1]) {
        return `Your dog's name is ${match[1]}.`;
      }
    }
  }

  return null;
}