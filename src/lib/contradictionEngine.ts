export function detectContradiction(
    memories: any[],
    userMessage: string
  ) {
    const combined = memories
      .slice(0, 40)
      .map((m) => (m.memory || "").toLowerCase())
      .join(" ");
  
    const text = userMessage.toLowerCase();
  
    // ambition vs exhaustion
    const ambition =
      combined.includes("success") ||
      combined.includes("future") ||
      combined.includes("build") ||
      combined.includes("ambition");
  
    const exhaustion =
      combined.includes("tired") ||
      combined.includes("exhausted") ||
      combined.includes("drained");
  
    if (
      ambition &&
      exhaustion &&
      (
        text.includes("can't") ||
        text.includes("stuck") ||
        text.includes("avoid") ||
        text.includes("tired")
      )
    ) {
      return "ambition_exhaustion";
    }
  
    // connection vs distance
    const relationships =
      combined.includes("wife") ||
      combined.includes("family") ||
      combined.includes("love");
  
    const loneliness =
      combined.includes("lonely") ||
      combined.includes("disconnected");
  
    if (
      relationships &&
      loneliness &&
      (
        text.includes("alone") ||
        text.includes("empty") ||
        text.includes("disconnected")
      )
    ) {
      return "connection_distance";
    }
  
    // identity contradiction
    const identity =
      combined.includes("who i am") ||
      combined.includes("becoming") ||
      combined.includes("lost");
  
    if (
      identity &&
      (
        text.includes("don't know") ||
        text.includes("lost") ||
        text.includes("confused")
      )
    ) {
      return "identity_conflict";
    }
  
    return null;
  }
  
  export function getContradictionInstruction(
    contradiction: string | null
  ) {
    if (!contradiction) return "";
  
    switch (contradiction) {
      case "ambition_exhaustion":
        return `
  INNER CONTRADICTION:
  
  The user simultaneously carries ambition and exhaustion.
  
  You may subtly notice:
  - pushing hard while feeling drained
  - wanting growth while emotionally overloaded
  
  Do not sound clinical.
  Do not over-analyze.
  `.trim();
  
      case "connection_distance":
        return `
  INNER CONTRADICTION:
  
  The user has people around them, yet still feels emotionally distant.
  
  Notice the emotional tension quietly.
  Do not over-comfort.
  `.trim();
  
      case "identity_conflict":
        return `
  INNER CONTRADICTION:
  
  The user seems disconnected from who they expected themselves to become.
  
  Respond with subtle emotional observation.
  Avoid therapy language.
  `.trim();
  
      default:
        return "";
    }
  }