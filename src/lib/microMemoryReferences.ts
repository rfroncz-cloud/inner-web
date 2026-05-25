export function buildMicroMemoryReference(
    memories: any[],
    userMessage: string
  ) {
    if (!memories?.length) {
      return "";
    }
  
    const combined = memories
      .slice(0, 30)
      .map((m) => (m.memory || "").toLowerCase())
      .join(" ");
  
    const text = userMessage.toLowerCase();
  
    if (
      text.includes("pressure") ||
      text.includes("stress")
    ) {
      if (
        combined.includes("pressure") ||
        combined.includes("stress") ||
        combined.includes("overthinking")
      ) {
        return `
  Subtle continuity:
  This emotional weight has appeared before.
  
  You may naturally say things like:
  - "That pressure keeps finding you."
  - "This weight keeps returning."
  - "Your mind has been carrying this for a while."
  
  Do not sound clinical.
  Do not say "as before".
  `;
      }
    }
  
    if (
      text.includes("tired") ||
      text.includes("exhausted")
    ) {
      if (
        combined.includes("tired") ||
        combined.includes("drained")
      ) {
        return `
  Subtle continuity:
  The user's exhaustion is recurring.
  
  You may naturally say:
  - "You sound tired in a familiar way."
  - "...yeah. That tiredness again."
  - "You've been carrying this for longer than tonight."
  
  Keep it restrained.
  `;
      }
    }
  
    if (
      text.includes("lonely") ||
      text.includes("disconnected")
    ) {
      if (
        combined.includes("lonely") ||
        combined.includes("disconnected")
      ) {
        return `
  Subtle continuity:
  The user's emotional distance has appeared before.
  
  You may naturally say:
  - "That distance keeps showing up."
  - "You sound far away again."
  - "Being around people still feels distant."
  
  Do not over-explain.
  `;
      }
    }
  
    return "";
  }