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
  
  export function shouldSaveMemory(message: string): boolean {
    const text = message.toLowerCase().trim();
  
    if (!text || text.length < 20) return false;

    const personalSignals = [
      "my name is",
      "i am",
      "i live",
      "i feel",
      "i want",
      "i need",
      "i love",
      "i hate",
      "i fear",
      "i worry",
      "my goal",
      "my dream",
      "my wife",
      "my husband",
      "my son",
      "my daughter",
      "my family",
      "my project",
      "my business",
    
      "mam na imię",
      "nazywam się",
      "jestem",
      "mieszkam",
      "czuję",
      "chcę",
      "potrzebuję",
      "kocham",
      "nienawidzę",
      "boję się",
      "martwię się",
      "moim celem",
      "moje marzenie",
      "moja żona",
      "mój mąż",
      "mój syn",
      "moja córka",
      "moja rodzina",
      "mój projekt",
      "moja firma",
      // Family
"my wife",
"my husband",
"my partner",
"my son",
"my daughter",
"my child",
"my children",
"my mother",
"my father",
"my brother",
"my sister",
"my family",

// Pets
"my dog",
"my cat",
"my pet",
"my pets",

// Home / location
"i live in",
"i live at",
"my home",
"my house",
"my apartment",
"where i live",

// Car
"my car",
"i drive",
"i have a car",

// Birth / childhood
"i was born",
"my birthday",
"where i was born",
"i grew up",
"where i grew up",

// Polish
"moja żona",
"mój mąż",
"moja partnerka",
"mój partner",
"mój syn",
"moja córka",
"moje dziecko",
"moje dzieci",
"moja mama",
"mój tata",
"mój brat",
"moja siostra",
"moja rodzina",

"mój pies",
"moja suka",
"mój kot",
"moja kotka",
"moje zwierzę",
"moje zwierzęta",

"mieszkam w",
"mieszkam na",
"mój dom",
"moje mieszkanie",

"mój samochód",
"jeżdżę",
"mam samochód",

"urodziłem się",
"urodziłam się",
"moje urodziny",
"wychowałem się",
"wychowałam się",
    ];
    
    if (personalSignals.some((signal) => text.includes(signal))) {
      return true;
    }
  
    const ignorePatterns = [
      // English
      "what is my name",
      "what's my name",
      "do you remember me",
      "what do you know about me",
      "what day is it",
      "what time is it",
      "go deeper",
      "deep analysis",
      "analyze this",
      "test",
      "testing",
  
      // Polish
      "jak mam na imię",
      "jak mam na imie",
      "czy mnie pamiętasz",
      "czy mnie pamietasz",
      "co o mnie wiesz",
      "jaki dziś dzień",
      "jaki dzis dzien",
      "która godzina",
      "ktora godzina",
  
      // French
      "comment je m'appelle",
      "tu te souviens de moi",
      "qu'est-ce que tu sais de moi",
      "quel jour sommes-nous",
      "quelle heure est-il",
  
      // Spanish
      "cómo me llamo",
      "como me llamo",
      "te acuerdas de mí",
      "te acuerdas de mi",
      "qué sabes de mí",
      "que sabes de mi",
      "qué hora es",
      "que hora es",
  
      // German
      "wie heiße ich",
      "wie heisse ich",
      "erinnerst du dich an mich",
      "was weißt du über mich",
      "was weisst du uber mich",
      "wie spät ist es",
      "wie spaet ist es",
  
      // Italian
      "come mi chiamo",
      "ti ricordi di me",
      "cosa sai di me",
      "che ore sono",
  
      // Generic low value
      "hello",
      "hi",
      "hey",
      "hej",
      "siema",
      "ok",
      "okay",
      "okej",
      "lol",
      "xd",
      "haha",
      "😂",
      "👍",
    ];
  
    if (ignorePatterns.some((pattern) => text.includes(pattern))) {
      return false;
    }
  
    const valuableSignals = [
      // Identity
      "my name is",
      "i am",
      "i live in",
      "i was born",
      "birthday",
  
      // Goals / projects
      "my goal",
      "i want to build",
      "i am building",
      "my project",
      "startup",
      "business",
      "inner",
  
      // Emotions / personal meaning
      "i feel",
      "i'm afraid",
      "i am afraid",
      "i love",
      "i hate",
      "i worry",
      "i'm stressed",
      "i am stressed",
      "this is important",
      "this matters to me",
  
      // Relationships
      "my wife",
      "my husband",
      "my son",
      "my daughter",
      "my mother",
      "my father",
      "my family",
      "my friend",
  
      // Polish useful signals
      "mam na imię",
      "nazywam się",
      "moim celem",
      "chcę zbudować",
      "buduję",
      "mój projekt",
      "moja firma",
      "boję się",
      "martwię się",
      "to jest dla mnie ważne",
      "moja żona",
      "mój syn",
      "moja córka",
      "moja rodzina",
  
      // French useful signals
      "mon objectif",
      "je veux construire",
      "je construis",
      "mon projet",
      "c'est important pour moi",
      "j'ai peur",
      "je m'inquiète",
  
      // Spanish useful signals
      "mi objetivo",
      "quiero construir",
      "estoy construyendo",
      "mi proyecto",
      "es importante para mí",
      "tengo miedo",
      "me preocupa",
  
      // German useful signals
      "mein ziel",
      "ich möchte bauen",
      "ich baue",
      "mein projekt",
      "das ist mir wichtig",
      "ich habe angst",
  
      // Italian useful signals
      "il mio obiettivo",
      "voglio costruire",
      "sto costruendo",
      "il mio progetto",
      "è importante per me",
      "ho paura",
    ];
  
    if (valuableSignals.some((signal) => text.includes(signal))) {
      return true;
    }
  
    // Save longer, meaningful messages, but ignore short noise.
    if (text.length > 120) return true;
  
    return false;
  }

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