export type UsagePlan = "free" | "premium";

export function getDailyMessageLimit(plan: UsagePlan): number {
  if (plan === "premium") return 500;
  return 30;
}

export function getGeniusDailyLimit(plan: UsagePlan): number {
  if (plan === "premium") return 30;
  return 0;
}

export function canSendMessage(params: {
  plan: UsagePlan;
  dailyMessages: number;
}): boolean {
  return params.dailyMessages < getDailyMessageLimit(params.plan);
}
export function getMaxMemoryCount(
    plan: UsagePlan
  ): number {
    if (plan === "premium") return 200;
  
    return 25;
  }
  
  export function getMaxResponseDepth(
    plan: UsagePlan
  ): "minimal" | "normal" | "deep" {
    if (plan === "premium") return "deep";
  
    return "normal";
  }
  export function shouldShowUpgradeHint(params: {
    plan: UsagePlan;
    dailyMessages: number;
  }): boolean {
    if (params.plan === "premium") return false;
  
    return (
      params.dailyMessages === 10 ||
      params.dailyMessages === 20 ||
      params.dailyMessages >= 28
    );
  }
  export function getMaxInputLength(
    plan: UsagePlan
  ): number {
    if (plan === "premium") return 6000;
  
    return 1200;
  }
  export function getPlanStatus(params: {
    plan: UsagePlan;
    dailyMessages: number;
  }) {
    const dailyLimit = getDailyMessageLimit(params.plan);
    const remainingMessages = Math.max(
      dailyLimit - params.dailyMessages,
      0
    );
  
    return {
      plan: params.plan,
      dailyLimit,
      dailyMessages: params.dailyMessages,
      remainingMessages,
      isPremium: params.plan === "premium",
      memoryLimit: getMaxMemoryCount(params.plan),
      responseDepth: getMaxResponseDepth(params.plan),
      showUpgradeHint: shouldShowUpgradeHint(params),
    };
  }