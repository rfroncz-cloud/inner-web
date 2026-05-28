"use client";

// ---------------------------------------------------------------------------
// User Profile Reflection — shown inside Inner View → Reflection tab.
// A soft, human snapshot of how INNER is coming to understand the user.
// Reads a UserProfile (already computed upstream). No AI calls.
// ---------------------------------------------------------------------------

import type { UserProfile } from "@/lib/userProfileEngine";
import { prettyStyleLabel } from "@/lib/userProfileEngine";

type Props = {
  profile: UserProfile;
  summary: string;
};

function confidenceWord(c: number): string {
  if (c >= 70) return "Clear";
  if (c >= 45) return "Emerging";
  return "Faint";
}

function Chip({ label, confidence }: { label: string; confidence: number }) {
  // Only render meaningful signals — keeps it calm, not a data dump.
  const tone =
    confidence >= 60
      ? "border-violet-300/30 bg-violet-400/10 text-violet-100/80"
      : "border-white/[0.08] bg-white/[0.02] text-white/55";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11.5px] ${tone}`}
    >
      {prettyStyleLabel(label)}
    </span>
  );
}

export function UserProfileReflection({ profile, summary }: Props) {
  const styles = [
    profile.communicationStyle && {
      key: "communication",
      title: "Communication",
      value: profile.communicationStyle.value,
      confidence: profile.communicationStyle.confidence,
    },
    profile.decisionMakingStyle && {
      key: "decision",
      title: "Decisions",
      value: profile.decisionMakingStyle.value,
      confidence: profile.decisionMakingStyle.confidence,
    },
    profile.relationshipStyle && {
      key: "relationship",
      title: "Closeness",
      value: profile.relationshipStyle.value,
      confidence: profile.relationshipStyle.confidence,
    },
  ].filter(Boolean) as {
    key: string;
    title: string;
    value: string;
    confidence: number;
  }[];

  const topValues = profile.values.filter((v) => v.confidence >= 40).slice(0, 4);
  const topInterests = profile.interests.filter((i) => i.confidence >= 40).slice(0, 5);
  const topGoals = profile.goals.filter((g) => g.confidence >= 40).slice(0, 3);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.28em] text-violet-200/40">
          How INNER sees you
        </p>
        <span className="text-[10px] uppercase tracking-[0.18em] text-white/30">
          {confidenceWord(profile.profileConfidence)}
        </span>
      </div>

      {/* Confidence bar */}
      <div className="mb-4 h-1 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500/60 to-blue-400/60 transition-all duration-500"
          style={{ width: `${profile.profileConfidence}%` }}
        />
      </div>

      {/* Soft summary */}
      <p className="mb-5 text-[14px] font-light leading-relaxed text-white/75">
        {summary}
      </p>

      {/* Style chips */}
      {styles.length > 0 && (
        <div className="mb-4 space-y-2.5">
          {styles.map((s) => (
            <div key={s.key} className="flex items-center justify-between gap-3">
              <span className="text-[11px] uppercase tracking-[0.16em] text-white/30">
                {s.title}
              </span>
              <Chip label={s.value} confidence={s.confidence} />
            </div>
          ))}
        </div>
      )}

      {/* Values */}
      {topValues.length > 0 && (
        <div className="mb-3">
          <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/25">Values</p>
          <div className="flex flex-wrap gap-2">
            {topValues.map((v) => (
              <Chip key={v.label} label={v.label} confidence={v.confidence} />
            ))}
          </div>
        </div>
      )}

      {/* Interests */}
      {topInterests.length > 0 && (
        <div className="mb-3">
          <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/25">Drawn to</p>
          <div className="flex flex-wrap gap-2">
            {topInterests.map((i) => (
              <Chip key={i.label} label={i.label} confidence={i.confidence} />
            ))}
          </div>
        </div>
      )}

      {/* Goals — free-text, kept as quiet lines rather than chips */}
      {topGoals.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/25">
            Working toward
          </p>
          <ul className="space-y-1.5">
            {topGoals.map((g) => (
              <li key={g.label} className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-violet-300/50" />
                <span className="text-[13px] text-white/60">{g.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
