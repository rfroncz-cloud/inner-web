"use client";

// ---------------------------------------------------------------------------
// Profile View — Inner View → Profile tab
// Clean Apple-style cards built from UserProfile data. No AI calls.
// Empty state shown per-section when there isn't enough signal yet.
// ---------------------------------------------------------------------------

import type { UserProfile, ScoredItem } from "@/lib/userProfileEngine";
import { prettyStyleLabel } from "@/lib/userProfileEngine";

type Props = {
  profile: UserProfile;
  summary: string;
};

// ─── Shared primitives ────────────────────────────────────────────────────────

function Empty() {
  return (
    <p className="text-[13px] text-white/25 italic">
      INNER is still learning about this.
    </p>
  );
}

function CardShell({
  eyebrow,
  children,
}: {
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4">
      <p className="mb-3 text-[9.5px] uppercase tracking-[0.3em] text-white/25">
        {eyebrow}
      </p>
      {children}
    </div>
  );
}

// ─── Style pill (Communication / Decision / Relationship) ─────────────────────

const STYLE_DESCRIPTIONS: Record<string, string> = {
  // communication
  direct:      "You tend to say what you mean.",
  reflective:  "You think things through before you speak.",
  analytical:  "You reason through feelings with logic.",
  emotional:   "You lead with how you feel.",
  // decision
  impulsive:   "You move quickly, on instinct.",
  cautious:    "You weigh things carefully before acting.",
  strategic:   "You plan with the long game in mind.",
  // relationship
  avoidant:        "You value space when things feel heavy.",
  secure:          "You're comfortable being open with people you trust.",
  seeking_connection: "You're drawn to closeness and belonging.",
};

function StyleCard({
  eyebrow,
  value,
  confidence,
}: {
  eyebrow: string;
  value: string;
  confidence: number;
}) {
  const desc = STYLE_DESCRIPTIONS[value] ?? "";
  const isLow = confidence < 35;

  return (
    <CardShell eyebrow={eyebrow}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p
            className={`text-[16px] font-light ${
              isLow ? "text-white/45" : "text-white/85"
            }`}
          >
            {prettyStyleLabel(value)}
          </p>
          {desc && (
            <p className="mt-1 text-[12.5px] text-white/40 leading-relaxed">
              {desc}
            </p>
          )}
        </div>
        <ConfidenceBar confidence={confidence} />
      </div>
    </CardShell>
  );
}

function ConfidenceBar({ confidence }: { confidence: number }) {
  const label =
    confidence >= 65 ? "Clear" : confidence >= 40 ? "Emerging" : "Faint";
  const color =
    confidence >= 65
      ? "bg-violet-400/60"
      : confidence >= 40
      ? "bg-blue-400/50"
      : "bg-white/20";

  return (
    <div className="shrink-0 flex flex-col items-end gap-1.5 pt-0.5">
      <span className="text-[9px] uppercase tracking-[0.2em] text-white/25">
        {label}
      </span>
      <div className="w-16 h-1 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${confidence}%` }}
        />
      </div>
    </div>
  );
}

// ─── Chip list (Values / Interests) ───────────────────────────────────────────

function Chip({
  label,
  confidence,
}: {
  label: string;
  confidence: number;
}) {
  const strong = confidence >= 60;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11.5px] transition-colors ${
        strong
          ? "border-violet-300/30 bg-violet-400/[0.08] text-violet-100/80"
          : "border-white/[0.07] bg-white/[0.02] text-white/50"
      }`}
    >
      {prettyStyleLabel(label)}
    </span>
  );
}

function ChipCard({
  eyebrow,
  items,
}: {
  eyebrow: string;
  items: ScoredItem[];
}) {
  const visible = items.filter((i) => i.confidence >= 35);
  return (
    <CardShell eyebrow={eyebrow}>
      {visible.length === 0 ? (
        <Empty />
      ) : (
        <div className="flex flex-wrap gap-2">
          {visible.map((i) => (
            <Chip key={i.label} label={i.label} confidence={i.confidence} />
          ))}
        </div>
      )}
    </CardShell>
  );
}

// ─── Goals list ───────────────────────────────────────────────────────────────

function GoalsCard({ items }: { items: ScoredItem[] }) {
  const visible = items.filter((g) => g.confidence >= 35).slice(0, 5);
  return (
    <CardShell eyebrow="Goals">
      {visible.length === 0 ? (
        <Empty />
      ) : (
        <ul className="space-y-2.5">
          {visible.map((g) => (
            <li key={g.label} className="flex items-start gap-2.5">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-violet-300/50" />
              <span className="text-[13.5px] font-light text-white/70 leading-snug capitalize">
                {g.label}
              </span>
            </li>
          ))}
        </ul>
      )}
    </CardShell>
  );
}

// ─── Summary hero card ────────────────────────────────────────────────────────

function SummaryCard({
  summary,
  confidence,
}: {
  summary: string;
  confidence: number;
}) {
  const word =
    confidence >= 65 ? "Clear" : confidence >= 35 ? "Emerging" : "Learning";

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] px-5 py-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[9.5px] uppercase tracking-[0.3em] text-violet-200/40">
          How INNER sees you
        </p>
        <span className="text-[9px] uppercase tracking-[0.2em] text-white/25">
          {word}
        </span>
      </div>
      {/* Overall confidence bar */}
      <div className="mb-4 h-[3px] rounded-full bg-white/[0.05] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500/60 to-blue-400/50 transition-all duration-700"
          style={{ width: `${confidence}%` }}
        />
      </div>
      <p className="text-[14px] font-light leading-relaxed text-white/70">
        {summary}
      </p>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export function ProfileView({ profile, summary }: Props) {
  return (
    <div className="space-y-3 pb-4">
      <SummaryCard summary={summary} confidence={profile.profileConfidence} />

      {/* Style cards — shown only if there's a detected value */}
      {profile.communicationStyle ? (
        <StyleCard
          eyebrow="Communication"
          value={profile.communicationStyle.value}
          confidence={profile.communicationStyle.confidence}
        />
      ) : (
        <CardShell eyebrow="Communication">
          <Empty />
        </CardShell>
      )}

      {profile.decisionMakingStyle ? (
        <StyleCard
          eyebrow="Decisions"
          value={profile.decisionMakingStyle.value}
          confidence={profile.decisionMakingStyle.confidence}
        />
      ) : (
        <CardShell eyebrow="Decisions">
          <Empty />
        </CardShell>
      )}

      {profile.relationshipStyle ? (
        <StyleCard
          eyebrow="Closeness"
          value={profile.relationshipStyle.value}
          confidence={profile.relationshipStyle.confidence}
        />
      ) : (
        <CardShell eyebrow="Closeness">
          <Empty />
        </CardShell>
      )}

      <GoalsCard items={profile.goals} />
      <ChipCard eyebrow="Values" items={profile.values} />
      <ChipCard eyebrow="Interests" items={profile.interests} />
    </div>
  );
}
