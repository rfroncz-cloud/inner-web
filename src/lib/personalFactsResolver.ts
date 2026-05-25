type Memory = {
    memory?: string;
    category?: string;
  };
  
  function findMemory(memories: Memory[], phrases: string[]) {
    return memories.find((m) => {
      const text = (m.memory || "").toLowerCase();
      return phrases.some((phrase) => text.includes(phrase));
    });
  }
  
  function cleanAnswer(memory: string) {
    return memory.replace(/^User's /i, "Your ");
  }
  
  export function resolvePersonalFact(
    userMessage: string,
    memories: Memory[]
  ): string | null {
    const text = userMessage.toLowerCase();
  
    const asksName =
      text.includes("what is my name") ||
      text.includes("what's my name") ||
      text.includes("jak mam na imię") ||
      text.includes("jak mam na imie");
  
    if (asksName) {
      const memory = findMemory(memories, [
        "user's name is",
        "my name is",
        "mam na imię",
      ]);
  
      return memory?.memory
        ? cleanAnswer(memory.memory)
        : null;
    }
  
    const asksWife =
      text.includes("who is my wife") ||
      text.includes("what is my wife's name") ||
      text.includes("what's my wife's name") ||
      text.includes("jak ma na imię moja żona") ||
      text.includes("jak ma na imie moja zona");
  
    if (asksWife) {
      const memory = findMemory(memories, [
        "user's wife is",
      ]);
  
      return memory?.memory
        ? cleanAnswer(memory.memory)
        : null;
    }
  
    const asksSon =
      text.includes("who is my son") ||
      text.includes("what is my son's name") ||
      text.includes("what's my son's name") ||
      text.includes("jak ma na imię mój syn") ||
      text.includes("jak ma na imie moj syn");
  
    if (asksSon) {
      const memory = findMemory(memories, [
        "user's son is",
      ]);
  
      return memory?.memory
        ? cleanAnswer(memory.memory)
        : null;
    }
  
    const asksDog =
      text.includes("who is my dog") ||
      text.includes("what is my dog's name") ||
      text.includes("what's my dog's name") ||
      text.includes("jak ma na imię mój pies") ||
      text.includes("jak ma na imie moj pies");
  
    if (asksDog) {
      const memory = findMemory(memories, [
        "user's dog is",
      ]);
  
      return memory?.memory
        ? cleanAnswer(memory.memory)
        : null;
    }
  
    const asksCat =
      text.includes("who is my cat") ||
      text.includes("what is my cat's name") ||
      text.includes("what's my cat's name") ||
      text.includes("jak ma na imię mój kot") ||
      text.includes("jak ma na imie moj kot");
  
    if (asksCat) {
      const memory = findMemory(memories, [
        "user's cat is",
      ]);
  
      return memory?.memory
        ? cleanAnswer(memory.memory)
        : null;
    }
  
    const asksHome =
      text.includes("where do i live") ||
      text.includes("where am i living") ||
      text.includes("gdzie mieszkam");
  
    if (asksHome) {
      const memory = findMemory(memories, [
        "user lives in",
      ]);
  
      return memory?.memory
        ? cleanAnswer(memory.memory)
        : null;
    }
  
    const asksBirthday =
      text.includes("when is my birthday") ||
      text.includes("what is my birthday") ||
      text.includes("kiedy mam urodziny");
  
    if (asksBirthday) {
      const memory = findMemory(memories, [
        "user's birthday is",
      ]);
  
      return memory?.memory
        ? cleanAnswer(memory.memory)
        : null;
    }
  
    const asksBorn =
      text.includes("where was i born") ||
      text.includes("gdzie się urodziłem") ||
      text.includes("gdzie sie urodzilem");
  
    if (asksBorn) {
      const memory = findMemory(memories, [
        "user was born in",
      ]);
  
      return memory?.memory
        ? cleanAnswer(memory.memory)
        : null;
    }
  
    return null;
  }