"use client";

import { useEffect, useState } from "react";
import {
  type VoiceState,
  getVoiceStatusText,
  getOrbMotion,
} from "@/lib/voiceState";

type Props = {
  // Optional context to enrich the presence subtitle (reused from elsewhere).
  presenceSubtitle?: string;
  relationshipLabel?: string;
  moodState?: string;
};

const ORB_PACE_CLASS: Record<ReturnType<typeof getOrbMotion>["pace"], string> = {
  slow: "voice-orb-slow",
  medium: "voice-orb-medium",
  active: "voice-orb-active",
  strong: "voice-orb-strong",
};

// State cycle order for the (manual, demo-only) tap-through control.
const CYCLE: VoiceState[] = ["idle", "listening", "thinking", "speaking"];

export function VoiceMode({
  presenceSubtitle,
  relationshipLabel,
  moodState,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<VoiceState>("idle");

  useEffect(() => setMounted(true), []);

  const motion = getOrbMotion(state);
  const paceClass = ORB_PACE_CLASS[motion.pace];
  const statusText = mounted ? getVoiceStatusText(state, state) : "Waiting for you...";

  const cycleState = () => {
    setState((prev) => {
      const idx = CYCLE.indexOf(prev);
      return CYCLE[(idx + 1) % CYCLE.length];
    });
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center overflow-hidden">
      {/* Orb — tap to preview voice states */}
      <button
        type="button"
        onClick={cycleState}
        aria-label="Tap to cycle voice state (preview)"
        className="relative flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 rounded-full"
      >
        {/* Outer halo — clipped so it never causes horizontal scroll */}
        <div
          className={`absolute h-40 w-40 sm:h-44 sm:w-44 rounded-full bg-violet-500/10 blur-2xl ${paceClass}`}
          style={{ opacity: motion.glow * 0.7 }}
        />
        {/* Mid ring */}
        <div
          className={`absolute h-32 w-32 sm:h-36 sm:w-36 rounded-full bg-gradient-to-br from-violet-400/25 to-fuchsia-500/15 blur-md ${paceClass}`}
          style={{ opacity: motion.glow }}
        />
        {/* Core orb — minimum 96px for easy tap */}
        <div
          className={`relative h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-gradient-to-br from-violet-300/90 via-violet-400/70 to-fuchsia-500/60 ${paceClass}`}
          style={{
            boxShadow: `0 0 ${40 + motion.glow * 60}px rgba(167,139,250,${motion.glow})`,
          }}
        />
      </button>

      {/* Status text */}
      <p className="mt-12 text-[15px] tracking-[0.04em] text-white/80 transition-opacity duration-300">
        {statusText}
      </p>

      {/* State label — tiny, helps user understand the cycle */}
      {mounted && (
        <p className="mt-1 text-[9.5px] uppercase tracking-[0.28em] text-white/20">
          {state}
        </p>
      )}

      {/* Presence subtitle */}
      {presenceSubtitle && (
        <p className="mt-2 text-[12px] tracking-[0.04em] text-violet-200/45">
          {presenceSubtitle}
        </p>
      )}

      {/* Contextual line */}
      {(relationshipLabel || moodState) && (
        <p className="mt-6 text-[10px] uppercase tracking-[0.24em] text-white/25">
          {[relationshipLabel, moodState].filter(Boolean).join(" · ")}
        </p>
      )}

      {/* Foundation notice */}
      <p className="mt-10 max-w-[260px] text-[11px] leading-relaxed text-white/25">
        Voice conversations are coming. Tap the orb to preview INNER&apos;s
        presence.
      </p>
    </div>
  );
}
