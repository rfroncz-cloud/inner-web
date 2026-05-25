export function detectShadowPattern(memories: any[]) {
    if (!memories?.length) {
      return null;
    }
  
    let pressure = 0;
    let loneliness = 0;
    let exhaustion = 0;
    let ambition = 0;
    let identity = 0;
  
    for (const memory of memories) {
      const text = (memory.memory || "").toLowerCase();
  
      if (
        text.includes("pressure") ||
        text.includes("stress") ||
        text.includes("overthinking")
      ) {
        pressure++;
      }
  
      if (
        text.includes("lonely") ||
        text.includes("alone") ||
        text.includes("disconnected")
      ) {
        loneliness++;
      }
  
      if (
        text.includes("tired") ||
        text.includes("exhausted") ||
        text.includes("drained")
      ) {
        exhaustion++;
      }
  
      if (
        text.includes("future") ||
        text.includes("build") ||
        text.includes("success")
      ) {
        ambition++;
      }
  
      if (
        text.includes("who i am") ||
        text.includes("identity") ||
        text.includes("lost")
      ) {
        identity++;
      }
    }
  
    const patterns = [
      { type: "pressure", score: pressure },
      { type: "loneliness", score: loneliness },
      { type: "exhaustion", score: exhaustion },
      { type: "ambition", score: ambition },
      { type: "identity", score: identity },
    ];
  
    patterns.sort((a, b) => b.score - a.score);
  
    if (patterns[0].score < 2) {
      return null;
    }
  
    return patterns[0].type;
  }
  
  export function getShadowPatternInstruction(
    pattern: string | null
  ) {
    if (!pattern) return "";
  
    switch (pattern) {
      case "pressure":
        return `
  Recurring emotional pattern:
  The user repeatedly carries pressure and mental overload.
  
  Do not mention this clinically.
  Notice it subtly and naturally.
  `;
  
      case "loneliness":
        return `
  Recurring emotional pattern:
  The user repeatedly feels emotionally disconnected.
  
  Do not over-comfort.
  Respond with quiet emotional presence.
  `;
  
      case "exhaustion":
        return `
  Recurring emotional pattern:
  The user repeatedly sounds emotionally drained.
  
  Responses can become quieter and more restrained.
  `;
  
      case "ambition":
        return `
  Recurring emotional pattern:
  The user keeps returning to ambition, building and proving something.
  
  Notice the pressure underneath achievement.
  `;
  
      case "identity":
        return `
  Recurring emotional pattern:
  The user repeatedly questions who they are becoming.
  
  Respond with emotional subtlety, not analysis.
  `;
  
      default:
        return "";
    }
  }