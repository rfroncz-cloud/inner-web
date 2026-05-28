export type UserPlan = "free" | "premium";

// ─── Cost Mode ──────────────────────────────────────────────────────────────

export type CostMode = "cheap" | "balanced" | "premium";

export type CostModeParams = {
  userTier?: UserPlan;
  conversationMode?: string;
  emotionalIntensity?: number;
  requestedDepth?: string;
  messageLength?: number;
  memoryContextLines?: number;
  wantsWebSearch?: boolean;
  /** Raw user message text used for keyword-based premium detection. */
  rawMessage?: string;
};

const DEEP_ANALYSIS_TRIGGERS = [
  "analyze", "deep dive", "breakdown", "explain in detail", "help me understand why",
  "what's really going on", "go deeper", "full analysis", "thorough", "investigate",
];

const COMPLEX_REASONING_TRIGGERS = [
  "pros and cons", "compare", "weigh up", "trade-off", "long term", "strategic",
  "plan", "step by step", "walk me through",
];

export function determineCostMode(params: CostModeParams = {}): CostMode {
  const {
    userTier = "free",
    conversationMode,
    emotionalIntensity = 0,
    requestedDepth,
    messageLength = 0,
    wantsWebSearch = false,
  } = params;

  // Free users always stay cheap.
  if (userTier === "free") return "cheap";

  // Explicit premium signals: web search requested or deep-analysis depth.
  if (wantsWebSearch) return "premium";
  if (requestedDepth === "deep" || requestedDepth === "genius") return "premium";

  const lowerMsg = params.rawMessage ? params.rawMessage.toLowerCase() : "";

  if (DEEP_ANALYSIS_TRIGGERS.some((t) => lowerMsg.includes(t))) return "premium";
  if (COMPLEX_REASONING_TRIGGERS.some((t) => lowerMsg.includes(t))) return "premium";

  // Supportive / highly emotional context — balanced is enough; no need for premium.
  if (
    emotionalIntensity >= 0.7 ||
    conversationMode === "SUPPORTIVE" ||
    conversationMode === "REFLECTIVE"
  ) {
    return "balanced";
  }

  // Long messages with depth hint — balanced.
  if (messageLength > 120 && conversationMode !== "DIRECT") return "balanced";

  // Default for premium users.
  return "balanced";
}

// ─── Per-mode caps ───────────────────────────────────────────────────────────

export function getMaxOutputTokensForCostMode(mode: CostMode): number {
  switch (mode) {
    case "cheap":    return 80;
    case "balanced": return 260;
    case "premium":  return 600;
  }
}

export function getMaxMemoryLinesForCostMode(mode: CostMode): number {
  switch (mode) {
    case "cheap":    return 2;
    case "balanced": return 5;
    case "premium":  return 8;
  }
}

export function shouldAllowDeepReasoning(mode: CostMode): boolean {
  return mode === "premium";
}

export function shouldAllowWebSearch(mode: CostMode): boolean {
  return mode === "premium";
}

// ─── Logging helper ──────────────────────────────────────────────────────────

export function logCostMode(mode: CostMode, params: Pick<CostModeParams, "userTier">) {
  console.log("COST_MODE", {
    mode,
    userTier: params.userTier ?? "free",
    maxTokens: getMaxOutputTokensForCostMode(mode),
    maxMemoryLines: getMaxMemoryLinesForCostMode(mode),
    deepReasoning: shouldAllowDeepReasoning(mode),
    webSearch: shouldAllowWebSearch(mode),
  });
}



export function getDailyMessageLimit(plan: UserPlan) {
  if (plan === "premium") return 300;
  return 20;
}

export function getGeniusDailyLimit(plan: UserPlan) {
  if (plan === "premium") return 10;
  return 0;
}

export function shouldForceCheapMode({
  plan,
  dailyMessages,
}: {
  plan: UserPlan;
  dailyMessages: number;
}) {
  if (plan === "free" && dailyMessages > 12) return true;
  if (plan === "premium" && dailyMessages > 220) return true;
  return false;
}

export function protectModeByPlan({
  requestedMode,
  plan,
  geniusUsedToday,
  dailyMessages,
}: {
  requestedMode: "fast" | "core" | "smart" | "genius";
  plan: UserPlan;
  geniusUsedToday: number;
  dailyMessages: number;
}) {
  if (shouldForceCheapMode({ plan, dailyMessages })) return "fast";
  if (requestedMode === "genius" && plan === "free") return "smart";
  if (requestedMode === "genius" && geniusUsedToday >= getGeniusDailyLimit(plan)) {
    return "smart";
  }
  return requestedMode;
}
export function getCostWarningLevel({
    plan,
    dailyMessages,
    geniusUsedToday,
  }: {
    plan: UserPlan;
    dailyMessages: number;
    geniusUsedToday: number;
  }) {
    if (plan === "free" && dailyMessages >= 18) return "critical";
    if (plan === "free" && dailyMessages >= 14) return "warning";
  
    if (plan === "premium" && dailyMessages >= 280) return "critical";
    if (plan === "premium" && dailyMessages >= 230) return "warning";
  
    if (geniusUsedToday >= getGeniusDailyLimit(plan)) return "genius_locked";
  
    return "normal";
  }
  export function getResponseLimitInstruction(mode: string, emotionMode?: string) {
    if (mode === "fast") {
      if (emotionMode === "supportive") {
        return "Reply in 2-4 short sentences. Be warm but concise.";
      }
  
      if (emotionMode === "direct") {
        return "Reply in 1-3 short sentences. Be direct and practical.";
      }
  
      return "Reply in 1-3 short sentences. No long explanations.";
    }
  
    if (mode === "smart") {
      return "Reply naturally in 3-6 sentences. Give useful depth without over-explaining.";
    }
  
    if (mode === "genius") {
      return "Give a deeper answer only if the user clearly needs it. Stay structured and avoid unnecessary length.";
    }
  
    return "Reply concisely.";
  }