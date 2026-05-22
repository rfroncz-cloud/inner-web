export type InnerModelTier = "fast" | "core" | "smart" | "genius";

export type InnerUserPlan = "free" | "premium";

type RouterInput = {
  message: string;
  userPlan?: InnerUserPlan;
  isVoice?: boolean;
  hasImage?: boolean;
  hasFile?: boolean;
};

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

export function chooseInnerModel(input: RouterInput): InnerModelTier {
  const message = input.message?.trim() || "";
  const lower = message.toLowerCase();
  const length = message.length;

  const deepWords = [
    // English first.
    "deep analysis",
    "go deeper",
    "full analysis",
    "complete analysis",
    "full strategy",
    "complete strategy",

    // Polish support.
    "pełna analiza",
    "pelna analiza",
    "kompletna analiza",
    "pełna strategia",
    "pelna strategia",
  ];

  const smartWords = [
    // English first.
    "analyze",
    "analyse",
    "strategy",
    "debug",
    "code",
    "architecture",
    "roadmap",
    "business model",
    "startup",
    "financial",
    "marketing plan",

    // Polish support.
    "przeanalizuj",
    "analiza",
    "strategia",
    "debug",
    "kod",
    "architektura",
    "model biznesowy",
    "plan marketingowy",
  ];

  const coreWords = [
    // English first.
    "problem",
    "feel",
    "feeling",
    "afraid",
    "scared",
    "anxious",
    "anxiety",
    "emotion",
    "meaning",
    "purpose",
    "confused",
    "lost",
    "alone",
    "lonely",
    "sad",

    // Polish support.
    "problem",
    "czuję",
    "czuje",
    "boję",
    "boje",
    "emoc",
    "sens",
    "samot",
    "smut",
    "zagub",
    "lęk",
    "lek",
  ];

  if (length < 120 && !input.hasImage && !input.hasFile && !includesAny(lower, coreWords)) {
    return "fast";
  }

  if (input.userPlan === "free") {
    if (input.isVoice) return "fast";
    if (length > 900 || includesAny(lower, smartWords)) return "core";
    if (includesAny(lower, coreWords)) return "core";
    return "fast";
  }

  if (input.userPlan === "premium") {
    if (input.hasImage || input.hasFile || length > 2500 || includesAny(lower, deepWords)) {
      return "genius";
    }

    if (length > 700 || includesAny(lower, smartWords)) {
      return "smart";
    }

    if (length > 160 || includesAny(lower, coreWords)) {
      return "core";
    }

    return "fast";
  }

  return "fast";
}

export function getOpenAIModel(tier: InnerModelTier): string {
  switch (tier) {
    case "fast":
    case "core":
    case "smart":
    case "genius":
    default:
      return "gpt-4o-mini";
  }
}
