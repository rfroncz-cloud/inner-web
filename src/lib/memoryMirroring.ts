export function detectMemoryMirror(memories: any[], userMessage: string) {
    const text = userMessage.toLowerCase();
  
    const recent = memories
      .slice(0, 20)
      .map((m: any) => (m.memory || "").toLowerCase())
      .join(" ");
  
    if (
      text.includes("pressure") ||
      text.includes("stress") ||
      recent.includes("pressure") ||
      recent.includes("stress")
    ) {
      return "pressure";
    }
  
    if (
      text.includes("tired") ||
      text.includes("exhausted") ||
      text.includes("drained") ||
      recent.includes("tired") ||
      recent.includes("exhausted")
    ) {
      return "exhaustion";
    }
  
    if (
      text.includes("lonely") ||
      text.includes("alone") ||
      text.includes("disconnected") ||
      recent.includes("lonely") ||
      recent.includes("disconnected")
    ) {
      return "distance";
    }
  
    if (
      text.includes("future") ||
      text.includes("becoming") ||
      text.includes("who i am") ||
      recent.includes("becoming") ||
      recent.includes("who i am")
    ) {
      return "identity";
    }
  
    return null;
  }
  
  export function getMemoryMirrorInstruction(pattern: string | null) {
    if (!pattern) return "";
  
    switch (pattern) {
      case "pressure":
        return `
  MEMORY MIRRORING:
  
  The user has a pressure/overload theme.
  
  You may subtly mirror it with lines like:
  - "That pressure keeps circling back."
  - "Your mind keeps returning to that same weight."
  - "You keep carrying too much at once."
  
  Do not say this as diagnosis.
  Do not mention "pattern" directly.
  `.trim();
  
      case "exhaustion":
        return `
  MEMORY MIRRORING:
  
  The user has an exhaustion theme.
  
  You may subtly mirror it with lines like:
  - "That tiredness has been sitting there for a while."
  - "You sound tired in a deeper way lately."
  - "...yeah. That kind of tired does not feel new."
  
  Do not over-comfort.
  Keep it quiet.
  `.trim();
  
      case "distance":
        return `
  MEMORY MIRRORING:
  
  The user has an emotional distance / disconnection theme.
  
  You may subtly mirror it with lines like:
  - "That distance keeps showing up."
  - "Being around people still does not mean being reached."
  - "You sound far away from people again."
  
  Do not turn this into therapy.
  Keep it human and restrained.
  `.trim();
  
      case "identity":
        return `
  MEMORY MIRRORING:
  
  The user has an identity / becoming theme.
  
  You may subtly mirror it with lines like:
  - "You keep circling around who you are becoming."
  - "Something in you sounds unsure of its own shape."
  - "You sound far away from the version of yourself you expected."
  
  Do not analyze too much.
  Let it feel observed.
  `.trim();
  
      default:
        return "";
    }
  }