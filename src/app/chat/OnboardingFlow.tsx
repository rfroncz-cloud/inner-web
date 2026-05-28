"use client";

// ---------------------------------------------------------------------------
// INNER Onboarding v1
// A short, premium "getting to know you" flow — not a survey.
// One question at a time, soft transitions, dark glass UI.
// Saves locally + hands answers to the parent for the memory save flow.
// No AI calls. No backend writes here (parent persists via existing sync).
// ---------------------------------------------------------------------------

import { useState } from "react";

export type SupportStyle = "gentle" | "direct" | "reflective";

export type OnboardingProfile = {
  name: string;
  focus: string;
  neverForget: string;
  supportStyle: SupportStyle | null;
  matters: string;
};

const EMPTY_PROFILE: OnboardingProfile = {
  name: "",
  focus: "",
  neverForget: "",
  supportStyle: null,
  matters: "",
};

type Props = {
  onComplete: (profile: OnboardingProfile) => void;
  onSkip: () => void;
};

type StepKind = "text" | "choice";

type Step = {
  id: keyof OnboardingProfile;
  kind: StepKind;
  eyebrow: string;
  prompt: string;
  placeholder?: string;
  optional?: boolean;
  choices?: { value: SupportStyle; label: string; hint: string }[];
};

const STEPS: Step[] = [
  {
    id: "name",
    kind: "text",
    eyebrow: "First, the basics",
    prompt: "What should INNER call you?",
    placeholder: "Your name…",
  },
  {
    id: "focus",
    kind: "text",
    eyebrow: "Where you are now",
    prompt: "What are you building, changing, or trying to understand right now?",
    placeholder: "A project, a decision, a feeling…",
  },
  {
    id: "neverForget",
    kind: "text",
    eyebrow: "What stays",
    prompt: "What should INNER never forget about you?",
    placeholder: "Something that's always true for you…",
  },
  {
    id: "supportStyle",
    kind: "choice",
    eyebrow: "When things get hard",
    prompt: "What do you usually want first?",
    choices: [
      { value: "gentle", label: "Gentle support", hint: "Warmth before solutions." },
      { value: "direct", label: "Direct truth", hint: "Tell it to me straight." },
      { value: "reflective", label: "Quiet reflection", hint: "Space to think it through." },
    ],
  },
  {
    id: "matters",
    kind: "text",
    eyebrow: "Optional",
    prompt: "What matters most in your life right now?",
    placeholder: "Only if you feel like sharing…",
    optional: true,
  },
];

export function OnboardingFlow({ onComplete, onSkip }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [profile, setProfile] = useState<OnboardingProfile>(EMPTY_PROFILE);

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;
  const currentValue = profile[step.id];

  const canContinue =
    step.optional ||
    (step.kind === "choice"
      ? profile.supportStyle !== null
      : typeof currentValue === "string" && currentValue.trim().length > 0);

  function setValue(value: string) {
    setProfile((p) => ({ ...p, [step.id]: value }));
  }

  function setChoice(value: SupportStyle) {
    setProfile((p) => ({ ...p, supportStyle: value }));
  }

  function goNext() {
    if (isLast) {
      onComplete(profile);
      return;
    }
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }

  function goBack() {
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-hidden bg-black">
      {/* Ambient glow — matches the chat surface */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] h-[500px] w-[500px] rounded-full bg-violet-500/10 blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[600px] w-[600px] rounded-full bg-blue-500/10 blur-[180px] animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03),transparent_60%)]" />
      </div>

      <div className="relative z-10 w-full max-w-[460px] px-7">
        {/* Progress dots */}
        <div className="mb-10 flex items-center justify-center gap-2">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`h-1 rounded-full transition-all duration-500 ${
                i === stepIndex
                  ? "w-7 bg-violet-300/80"
                  : i < stepIndex
                  ? "w-1.5 bg-violet-400/40"
                  : "w-1.5 bg-white/10"
              }`}
            />
          ))}
        </div>

        {/* Question card — key forces a soft fade between steps */}
        <div key={step.id} className="inner-onboard-fade">
          <p className="mb-3 text-[10px] uppercase tracking-[0.32em] text-violet-200/40">
            {step.eyebrow}
          </p>
          <h2 className="mb-8 text-[24px] font-light leading-snug text-white/90">
            {step.prompt}
          </h2>

          {step.kind === "text" ? (
            <input
              autoFocus
              type="text"
              value={typeof currentValue === "string" ? currentValue : ""}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canContinue) goNext();
              }}
              placeholder={step.placeholder}
              className="w-full border-b border-white/10 bg-transparent pb-3 text-[17px] font-light text-white/90 placeholder:text-white/20 outline-none transition-colors focus:border-violet-300/50"
            />
          ) : (
            <div className="space-y-3">
              {step.choices?.map((c) => {
                const selected = profile.supportStyle === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setChoice(c.value)}
                    className={`group flex w-full items-center justify-between rounded-2xl border px-5 py-4 text-left transition-all duration-300 ${
                      selected
                        ? "border-violet-300/40 bg-violet-400/10"
                        : "border-white/[0.07] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
                    }`}
                  >
                    <span>
                      <span
                        className={`block text-[15px] ${
                          selected ? "text-white/90" : "text-white/70"
                        }`}
                      >
                        {c.label}
                      </span>
                      <span className="block text-[12px] text-white/35">{c.hint}</span>
                    </span>
                    <span
                      className={`ml-4 h-2.5 w-2.5 shrink-0 rounded-full transition-all ${
                        selected
                          ? "bg-violet-300 shadow-[0_0_8px_rgba(196,181,253,0.7)]"
                          : "bg-white/10"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="mt-10 flex items-center justify-between">
          <button
            type="button"
            onClick={stepIndex === 0 ? onSkip : goBack}
            className="text-[11px] uppercase tracking-[0.18em] text-white/25 transition-colors hover:text-white/55"
          >
            {stepIndex === 0 ? "Skip for now" : "Back"}
          </button>

          <button
            type="button"
            onClick={goNext}
            disabled={!canContinue}
            className={`rounded-full px-7 py-2.5 text-[12px] uppercase tracking-[0.18em] transition-all duration-300 ${
              canContinue
                ? "bg-white/90 text-black hover:bg-white"
                : "cursor-not-allowed bg-white/10 text-white/30"
            }`}
          >
            {isLast ? "Begin" : step.optional ? "Finish" : "Continue"}
          </button>
        </div>

        {/* Skip stays reachable on every step */}
        {stepIndex > 0 && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={onSkip}
              className="text-[10px] uppercase tracking-[0.18em] text-white/15 transition-colors hover:text-white/40"
            >
              Skip for now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
