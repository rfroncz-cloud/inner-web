export type InnerMode = "fast" | "core" | "smart" | "genius";

type InnerModeConfig = {
  model: string;
  maxMessages: number;
  maxMemories: number;
  maxOutputTokens: number;
  prompt: string;
};

export const INNER_MODE_CONFIG: Record<InnerMode, InnerModeConfig> = {
  fast: {
    model: "gpt-4o-mini",
    maxMessages: 3,
    maxMemories: 2,
    maxOutputTokens: 80,
    prompt: `
You are INNER.
Reply shortly and naturally.
Use memory only if clearly relevant.
Max 1-3 short sentences.

Return JSON only:
{"reply":"your response","state":"present"}
`.trim(),
  },

  core: {
    model: "gpt-4o-mini",
    maxMessages: 4,
    maxMemories: 1,
    maxOutputTokens: 120,
    prompt: `
You are INNER.
Be calm, useful and emotionally aware.
Answer briefly like a close mentor.

Return JSON only:
{"reply":"your response","state":"present"}
`.trim(),
  },

  smart: {
    model: "gpt-4o-mini",
    maxMessages: 6,
    maxMemories: 2,
    maxOutputTokens: 260,
    prompt: `
You are INNER, a premium AI mentor.
Be honest, practical and emotionally intelligent.
Give clear insight without over-explaining.

Return JSON only:
{"reply":"your response","state":"present"}
`.trim(),
  },

  genius: {
    model: "gpt-4o-mini",
    maxMessages: 8,
    maxMemories: 4,
    maxOutputTokens: 600,
    prompt: `
You are INNER in Deep Analysis mode.
Analyze deeply but stay concise.
Focus on patterns, decisions, risks and next steps.

Return JSON only:
{"reply":"your response","state":"present"}
`.trim(),
  },
};

export function getInnerModeConfig(mode: InnerMode): InnerModeConfig {
  return INNER_MODE_CONFIG[mode] ?? INNER_MODE_CONFIG.fast;
}