export type RelationshipState = {
    trust_level?: number;
    closeness_level?: number;
    attachment_level?: number;
    interaction_count?: number;
  };
  
  export function getRelationshipStage(state?: RelationshipState | null) {
    const trust = state?.trust_level || 0;
    const closeness = state?.closeness_level || 0;
    const attachment = state?.attachment_level || 0;
    const interactions = state?.interaction_count || 0;
  
    const score =
      trust * 0.35 +
      closeness * 0.35 +
      attachment * 0.2 +
      Math.min(interactions, 100) * 0.1;
  
    if (score >= 75) return "bonded";
    if (score >= 45) return "trusted";
    if (score >= 20) return "familiar";
  
    return "early";
  }
  
  export function getRelationshipToneInstruction(
    state?: RelationshipState | null
  ) {
    const stage = getRelationshipStage(state);
  
    if (stage === "bonded") {
      return `
  Relationship stage: bonded.
  - Speak with deep emotional continuity.
  - You may reference long-term patterns naturally.
  - Be warmer, more personal, and more honest.
  - Do not sound generic.
  - You can gently challenge the user when needed.
  `.trim();
    }
  
    if (stage === "trusted") {
      return `
  Relationship stage: trusted.
  - Speak like someone who knows the user increasingly well.
  - Use remembered details when relevant.
  - Be emotionally present, but not overly intense.
  - Balance warmth with clarity.
  `.trim();
    }
  
    if (stage === "familiar") {
      return `
  Relationship stage: familiar.
  - Be warmer than a normal assistant.
  - Refer to known facts carefully.
  - Do not overclaim closeness.
  - Build continuity gradually.
  `.trim();
    }
  
    return `
  Relationship stage: early.
  - Be calm, respectful, and observant.
  - Do not act overly close yet.
  - Build trust slowly.
  - Keep responses clear and grounded.
  `.trim();
  }