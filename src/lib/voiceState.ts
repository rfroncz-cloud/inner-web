// ---------------------------------------------------------------------------
// Voice Mode Foundation v1
// ---------------------------------------------------------------------------
// UI-only voice state foundation. No microphone, no speech-to-text, no
// text-to-speech — just a clean state machine + presence copy for a premium
// voice presence experience. Pure TypeScript, no AI calls, no backend.

export type VoiceState = "idle" | "listening" | "thinking" | "speaking";

// Module-level current state (single shared session value). The UI also keeps
// its own React state; these helpers exist so non-React code can read/set it.
let currentVoiceState: VoiceState = "idle";

export function getVoiceState(): VoiceState {
  return currentVoiceState;
}

export function setVoiceState(next: VoiceState): VoiceState {
  currentVoiceState = next;
  return currentVoiceState;
}

// Status text shown under the orb for each state. A small bank per state lets
// the UI vary copy deterministically without feeling random.
const STATE_STATUS: Record<VoiceState, string[]> = {
  idle: ["Waiting for you...", "Here when you're ready.", "Take your time."],
  listening: ["Listening...", "Go on.", "I'm with you."],
  thinking: ["Thinking...", "Sitting with that...", "Taking it in..."],
  speaking: ["Speaking...", "Sharing this...", "Here's what I notice..."],
};

function seedFrom(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h * 31 + text.charCodeAt(i)) % 100000;
  }
  return h / 100000;
}

export function getVoiceStatusText(
  state: VoiceState,
  seedText = ""
): string {
  const options = STATE_STATUS[state] ?? STATE_STATUS.idle;
  const idx = Math.floor(seedFrom(seedText || state) * options.length) % options.length;
  return options[idx];
}

// Tailwind animation + scale hints for the orb per state. The component maps
// these to concrete classes; keeping them here documents the intended motion.
export type OrbMotion = {
  // Relative scale of the orb's core.
  scale: number;
  // Glow intensity 0-1 (drives shadow opacity).
  glow: number;
  // Animation speed label.
  pace: "slow" | "medium" | "active" | "strong";
};

export function getOrbMotion(state: VoiceState): OrbMotion {
  switch (state) {
    case "listening":
      return { scale: 1.08, glow: 0.6, pace: "medium" };
    case "thinking":
      return { scale: 1.04, glow: 0.45, pace: "active" };
    case "speaking":
      return { scale: 1.14, glow: 0.85, pace: "strong" };
    case "idle":
    default:
      return { scale: 1.0, glow: 0.35, pace: "slow" };
  }
}
