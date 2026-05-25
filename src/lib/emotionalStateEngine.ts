export type EmotionalState = {
    stress: number;
    sadness: number;
    anger: number;
    confidence: number;
    tiredness: number;
    loneliness: number;
    mode: "calm" | "supportive" | "direct" | "protective" | "reflective";
  };
  
  function clamp(value: number) {
    return Math.max(0, Math.min(100, value));
  }
  
  export function detectEmotionalState(text: string): EmotionalState {
    const lower = text.toLowerCase();
  
    let stress = 20;
    let sadness = 10;
    let anger = 5;
    let confidence = 50;
    let tiredness = 10;
    let loneliness = 5;
  
    if (lower.includes("stress") || lower.includes("stressed") || lower.includes("presja")) stress += 35;
    if (lower.includes("boję") || lower.includes("boje") || lower.includes("afraid") || lower.includes("fear")) stress += 25;
  
    if (lower.includes("sad") || lower.includes("smutno") || lower.includes("źle mi") || lower.includes("zle mi")) sadness += 35;
    if (lower.includes("alone") || lower.includes("samotny") || lower.includes("samotnie") || lower.includes("lonely")) loneliness += 45;
  
    if (lower.includes("angry") || lower.includes("wkurzony") || lower.includes("zły") || lower.includes("zly")) anger += 40;
  
    if (lower.includes("tired") || lower.includes("exhausted") || lower.includes("zmęczony") || lower.includes("zmeczony")) tiredness += 45;
  
    if (lower.includes("dam radę") || lower.includes("dam rade") || lower.includes("i can do it") || lower.includes("i feel strong")) confidence += 30;
    if (lower.includes("nie dam rady") || lower.includes("i can't")) confidence -= 30;
  
    let mode: EmotionalState["mode"] = "calm";
  
    if (anger > 40) mode = "direct";
    else if (stress > 50) mode = "protective";
    else if (sadness > 40 || loneliness > 40) mode = "supportive";
    else if (tiredness > 40) mode = "calm";
    else if (confidence > 70) mode = "reflective";
  
    return {
      stress: clamp(stress),
      sadness: clamp(sadness),
      anger: clamp(anger),
      confidence: clamp(confidence),
      tiredness: clamp(tiredness),
      loneliness: clamp(loneliness),
      mode,
    };
  }