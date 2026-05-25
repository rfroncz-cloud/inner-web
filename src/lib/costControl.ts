export type UserPlan = "free" | "premium";

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