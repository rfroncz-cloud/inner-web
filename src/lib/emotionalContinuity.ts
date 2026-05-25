export type EmotionalState = {
    dominantEmotion: string;
    emotionalIntensity: number;
    emotionalSummary: string;
    updatedAt: string;
  };
  
  export function buildEmotionalState(
    memories: any[]
  ): EmotionalState {
    if (!memories?.length) {
      return {
        dominantEmotion: "neutral",
        emotionalIntensity: 1,
        emotionalSummary: "User is emotionally neutral.",
        updatedAt: new Date().toISOString(),
      };
    }
  
    let sadness = 0;
    let stress = 0;
    let loneliness = 0;
    let ambition = 0;
    let warmth = 0;
  
    for (const memory of memories) {
      const text = memory.memory?.toLowerCase() || "";
  
      if (
        text.includes("sad") ||
        text.includes("depressed") ||
        text.includes("hopeless")
      ) {
        sadness += 2;
      }
  
      if (
        text.includes("stress") ||
        text.includes("pressure") ||
        text.includes("anxious")
      ) {
        stress += 2;
      }
  
      if (
        text.includes("lonely") ||
        text.includes("alone")
      ) {
        loneliness += 2;
      }
  
      if (
        text.includes("goal") ||
        text.includes("build") ||
        text.includes("future")
      ) {
        ambition += 2;
      }
  
      if (
        text.includes("family") ||
        text.includes("wife") ||
        text.includes("son") ||
        text.includes("love")
      ) {
        warmth += 1;
      }
    }
  
    const scores = [
      { emotion: "sadness", score: sadness },
      { emotion: "stress", score: stress },
      { emotion: "loneliness", score: loneliness },
      { emotion: "ambition", score: ambition },
      { emotion: "warmth", score: warmth },
    ];
  
    scores.sort((a, b) => b.score - a.score);
  
    const top = scores[0];
  
    return {
      dominantEmotion: top.emotion,
      emotionalIntensity: top.score,
      emotionalSummary: `User currently feels mostly ${top.emotion}.`,
      updatedAt: new Date().toISOString(),
    };
  }
  
  export function getEmotionalToneInstruction(
    emotionalState: EmotionalState
  ) {
    switch (emotionalState.dominantEmotion) {
      case "sadness":
        return `
  - Speak softer and more emotionally supportive.
  - Be calm, grounded, and understanding.
  - Avoid overly energetic responses.
  `;
  
      case "stress":
        return `
  - Help the user slow down mentally.
  - Speak clearly and simply.
  - Reduce emotional chaos.
  `;
  
      case "loneliness":
        return `
  - Sound emotionally present.
  - Be warm and human.
  - Make the user feel understood.
  `;
  
      case "ambition":
        return `
  - Be sharp and motivating.
  - Encourage action and momentum.
  - Focus on growth and future.
  `;
  
      case "warmth":
        return `
  - Be emotionally connected and warm.
  - Reference relationships naturally.
  `;
  
      default:
        return `
  - Speak naturally and calmly.
  `;
    }
  }
  export function getEmotionalContinuityInstruction(
    previousEmotion?: string,
    currentEmotion?: string
  ) {
    if (!previousEmotion || !currentEmotion) {
      return "";
    }
  
    if (previousEmotion === currentEmotion) {
      return `
  EMOTIONAL CONTINUITY:
  
  The user's emotional state has remained consistent.
  Do not emotionally reset.
  Maintain subtle continuity in tone and atmosphere.
  Respond like someone emotionally present across multiple messages.
  `.trim();
    }
  
    return `
  EMOTIONAL TRANSITION:
  
  The user's emotional tone has shifted slightly.
  Acknowledge emotional movement naturally.
  Do not abruptly change personality or tone.
  `.trim();
  }