export type GlobalEmotion =
  | "loneliness"
  | "sadness"
  | "fear"
  | "pressure"
  | "anger"
  | "love"
  | "hope"
  | "business"
  | "spiritual"
  | "neutral";

const GLOBAL_SIGNAL_MAP: Record<GlobalEmotion, string[]> = {
  loneliness: [
    "lonely", "alone", "isolated",
    "samot", "sam", "samotny",
    "solo", "sola", "sozinho", "seul", "allein"
  ],

  sadness: [
    "sad", "empty", "hurt", "depressed",
    "smut", "pusto", "depres",
    "triste", "traurig"
  ],

  fear: [
    "fear", "afraid", "scared", "anxiety", "anxious",
    "boję", "boje", "lęk", "lek",
    "miedo", "ansiedad", "angst", "peur"
  ],

  pressure: [
    "stress", "pressure", "overwhelmed", "burnout", "exhausted",
    "stres", "presja", "zmęcz", "zmecz",
    "estrés", "pressão", "druck"
  ],

  anger: [
    "angry", "furious", "hate", "rage", "mad",
    "wkur", "złość", "zlosc", "nienaw",
    "odio", "raiva", "hass", "colère"
  ],

  love: [
    "love", "care", "important to me",
    "kocham", "ważny", "wazny",
    "amor", "amo", "liebe", "aime"
  ],

  hope: [
    "dream", "goal", "future", "hope", "purpose",
    "marzenie", "cel", "przyszłość", "przyszlosc", "sens"
  ],

  business: [
    "business", "startup", "money", "finance", "strategy", "company",
    "biznes", "firma", "finanse", "strategia",
    "empresa", "negocio", "geschäft"
  ],

  spiritual: [
    "god", "soul", "meaning", "faith", "spiritual",
    "bóg", "bog", "dusza", "wiara", "duch", "sens życia"
  ],

  neutral: [],
};

export function detectGlobalSignals(text: string): GlobalEmotion[] {
  const lower = text.toLowerCase();

  const matches = Object.entries(GLOBAL_SIGNAL_MAP)
    .filter(([emotion, words]) => {
      if (emotion === "neutral") return false;
      return words.some((word) => lower.includes(word));
    })
    .map(([emotion]) => emotion as GlobalEmotion);

  return matches.length ? matches : ["neutral"];
}

export function hasGlobalSignal(text: string, signal: GlobalEmotion) {
  const lower = text.toLowerCase();
  return GLOBAL_SIGNAL_MAP[signal].some((word) => lower.includes(word));
}
export function normalizeMemoryToEnglish(memory: string) {
    return memory
      .replace(/mam na imię/gi, "User's name is")
      .replace(/mam na imie/gi, "User's name is")
      .replace(/moja żona ma na imię/gi, "User's wife is named")
      .replace(/moja zona ma na imie/gi, "User's wife is named")
      .replace(/mój syn ma na imię/gi, "User's son is named")
      .replace(/moj syn ma na imie/gi, "User's son is named")
      .replace(/mój pies ma na imię/gi, "User's dog is named")
      .replace(/moj pies ma na imie/gi, "User's dog is named")
      .replace(/urodziny mam/gi, "User's birthday is")
      .replace(/mieszkam w/gi, "User lives in")
      .replace(/\s+/g, " ")
      .trim();
  }