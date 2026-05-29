"use client";

// ---------------------------------------------------------------------------
// INNER Dev Dashboard — DEV ONLY
// Three live sections in one scrollable panel:
//   A) System Health   — module operational status
//   B) Cost Health     — live cost mode & token caps
//   C) Release Checklist — binary readiness gates
// ---------------------------------------------------------------------------
// Visible only when NODE_ENV === "development".
// No AI calls · No backend writes · No sensitive user data.

import { useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = "active" | "needs_test" | "warning";

export type DepthOverride = "auto" | "new" | "familiar" | "trusted" | "deep";

export type DevDashboardProps = {
  // System health
  memoriesCount?: number;
  relationshipStage?: string;
  conversationMode?: string;
  innerPresence?: string;
  lifeEventsCount?: number;
  messagesCount?: number;
  // Cost health
  costMode?: string;
  costMaxTokens?: number;
  costMaxMemoryLines?: number;
  model?: string;
  // Relationship depth override (dev-only)
  depthOverride?: DepthOverride;
  onDepthOverrideChange?: (val: DepthOverride) => void;
  // Clears the visible chat and starts fresh (memories/profile/relationship untouched)
  onNewTestChat?: () => void;
};

// ─── Shared primitives ────────────────────────────────────────────────────────

const DOT: Record<Status, string> = {
  active:     "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.65)]",
  needs_test: "bg-yellow-400/75",
  warning:    "bg-red-400/85 shadow-[0_0_5px_rgba(248,113,113,0.55)]",
};

const BADGE: Record<Status, string> = {
  active:     "text-emerald-300/75",
  needs_test: "text-yellow-300/65",
  warning:    "text-red-300/75",
};

const BADGE_LABEL: Record<Status, string> = {
  active:     "Active",
  needs_test: "Needs test",
  warning:    "Warning",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9.5px] uppercase tracking-[0.3em] text-white/25 mb-3">
      {children}
    </p>
  );
}

// ─── D) Relationship Depth Override ──────────────────────────────────────────

const DEPTH_OPTIONS: DepthOverride[] = ["auto", "new", "familiar", "trusted", "deep"];

const DEPTH_COLOR: Record<string, string> = {
  auto:     "text-white/45",
  new:      "text-sky-300/80",
  familiar: "text-emerald-300/80",
  trusted:  "text-violet-300/80",
  deep:     "text-rose-300/80",
};

const DEPTH_PILL: Record<string, string> = {
  auto:     "border-white/10 bg-white/[0.04] text-white/40",
  new:      "border-sky-400/30 bg-sky-500/[0.08] text-sky-300/85",
  familiar: "border-emerald-400/30 bg-emerald-500/[0.08] text-emerald-300/85",
  trusted:  "border-violet-400/30 bg-violet-500/[0.08] text-violet-300/85",
  deep:     "border-rose-400/30 bg-rose-500/[0.08] text-rose-300/85",
};

function RelationshipDepthOverride({
  current,
  effective,
  onChange,
}: {
  current: DepthOverride;
  effective: string;
  onChange: (v: DepthOverride) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <SectionLabel>D · Relationship Level Override</SectionLabel>
        <p className="text-[10px] text-white/25 mb-3">
          Current Depth:{" "}
          <span className={`font-medium ${DEPTH_COLOR[effective] ?? "text-white/55"}`}>
            {effective.toUpperCase()}
          </span>
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {DEPTH_OPTIONS.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`
              rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.16em]
              transition-all duration-200
              ${current === opt
                ? DEPTH_PILL[opt]
                : "border-white/[0.07] bg-white/[0.02] text-white/25 hover:text-white/45 hover:border-white/15"
              }
            `}
          >
            {opt}
          </button>
        ))}
      </div>
      {current !== "auto" && (
        <p className="mt-2 text-[9.5px] text-yellow-300/50 tracking-wide">
          ⚡ Override active — depth forced to {current.toUpperCase()} for this session
        </p>
      )}
    </div>
  );
}

// ─── A) System Health ─────────────────────────────────────────────────────────

type SystemRow = { name: string; status: Status; note: string };

function buildSystemRows(p: DevDashboardProps): SystemRow[] {
  const mem  = p.memoriesCount  ?? 0;
  const msgs = p.messagesCount  ?? 0;
  const life = p.lifeEventsCount ?? 0;

  return [
    {
      name:   "Chat",
      status: msgs > 0 ? "active" : "needs_test",
      note:   msgs > 0 ? `${msgs} messages` : "Send a message first",
    },
    {
      name:   "Memory",
      status: mem > 0 ? "active" : "needs_test",
      note:   mem > 0 ? `${mem} stored` : "Share a personal fact",
    },
    {
      name:   "Compression",
      status: mem > 0 ? "active" : "needs_test",
      note:   "memoryCompression.ts",
    },
    {
      name:   "Relationship Patterns",
      status: mem >= 3 ? "active" : "needs_test",
      note:   mem >= 3 ? "scanning" : "Need ≥ 3 memories",
    },
    {
      name:   "Relationship Depth",
      status: p.relationshipStage ? "active" : "needs_test",
      note:   p.relationshipStage ?? "Awaiting first reply",
    },
    {
      name:   "Presence",
      status: p.innerPresence ? "active" : "needs_test",
      note:   p.innerPresence ?? "Starts after first reply",
    },
    {
      name:   "Life Events",
      status: life > 0 ? "active" : "needs_test",
      note:   life > 0 ? `${life} detected` : "Mention a birthday / goal",
    },
    { name: "Voice Foundation", status: "active", note: "UI only — no mic" },
    { name: "Mobile UI",        status: "active", note: "safe-area + dvh" },
  ];
}

function SystemHealth({ rows }: { rows: SystemRow[] }) {
  const active = rows.filter((r) => r.status === "active").length;
  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <SectionLabel>A · System Health</SectionLabel>
        <p className="text-[10px] tabular-nums text-white/25 mb-3">
          {active}/{rows.length}
        </p>
      </div>
      <div className="rounded-xl border border-white/[0.05] overflow-hidden divide-y divide-white/[0.04]">
        {rows.map((r) => (
          <div
            key={r.name}
            className="flex items-center justify-between gap-3 px-4 py-2.5 bg-white/[0.015]"
          >
            <div className="min-w-0">
              <p className="text-[12.5px] text-white/65 truncate">{r.name}</p>
              <p className="text-[10px] text-white/25 truncate">{r.note}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <div className={`h-2 w-2 rounded-full shrink-0 ${DOT[r.status]}`} />
              <span className={`text-[9.5px] uppercase tracking-[0.16em] ${BADGE[r.status]}`}>
                {BADGE_LABEL[r.status]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── B) Cost Health ───────────────────────────────────────────────────────────

type CostDataRow = { label: string; value: string; highlight?: boolean };

function buildCostRows(p: DevDashboardProps): CostDataRow[] {
  const mode   = p.costMode          ?? "—";
  const tokens = p.costMaxTokens     ?? "—";
  const lines  = p.costMaxMemoryLines ?? "—";
  const model  = p.model             ?? "—";

  const isCheap    = mode === "cheap";
  const isBalanced = mode === "balanced";
  const isPremium  = mode === "premium";

  return [
    {
      label: "Cost mode",
      value: mode.toUpperCase(),
      highlight: isCheap || isBalanced,
    },
    { label: "Model tier",         value: model },
    { label: "Max output tokens",  value: String(tokens) },
    { label: "Memory context lines", value: String(lines) },
    {
      label: "Web search",
      value: isPremium ? "yes" : "no",
    },
    {
      label: "Deep reasoning",
      value: isPremium ? "yes" : "no",
    },
  ];
}

const MODE_COLOR: Record<string, string> = {
  CHEAP:    "text-emerald-300/80",
  BALANCED: "text-blue-300/80",
  PREMIUM:  "text-violet-300/80",
};

function CostHealth({ rows, mode }: { rows: CostDataRow[]; mode: string }) {
  return (
    <div>
      <SectionLabel>B · Cost Health</SectionLabel>
      <div className="rounded-xl border border-white/[0.05] overflow-hidden divide-y divide-white/[0.04]">
        {rows.map((r) => {
          const isModeRow = r.label === "Cost mode";
          const modeKey = r.value.toUpperCase();
          const valueColor = isModeRow
            ? (MODE_COLOR[modeKey] ?? "text-white/55")
            : r.value === "no"
            ? "text-white/30"
            : "text-white/60";

          return (
            <div
              key={r.label}
              className="flex items-center justify-between gap-3 px-4 py-2.5 bg-white/[0.015]"
            >
              <p className="text-[12px] text-white/40">{r.label}</p>
              <p className={`text-[12px] font-medium tabular-nums ${valueColor}`}>
                {r.value}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── C) Release Checklist ─────────────────────────────────────────────────────

type CheckRow = { label: string; done: boolean; note?: string };

function buildCheckRows(p: DevDashboardProps): CheckRow[] {
  const mem  = p.memoriesCount ?? 0;
  const msgs = p.messagesCount ?? 0;

  return [
    {
      label: "Chat works",
      done:  msgs > 0,
      note:  msgs > 0 ? `${msgs} messages` : "Send a message",
    },
    {
      label: "Memory clean",
      done:  true,
      note:  "memoryCleanup.ts active",
    },
    {
      label: "Memory saves",
      done:  mem > 0,
      note:  mem > 0 ? `${mem} stored` : "Share a personal fact",
    },
    { label: "Inner View works",         done: true, note: "SideDrawer + tabs" },
    { label: "Mobile safe",              done: true, note: "safe-area + dvh" },
    { label: "Voice foundation ready",   done: true, note: "UI only, no mic" },
    { label: "User memory controls",     done: true, note: "clear + hide implemented" },
    { label: "No raw pattern keys shown", done: true, note: "human labels in MemoryPanel" },
    { label: "No extra AI calls",        done: true, note: "all libs are pure TS" },
    { label: "Cost caps active",         done: true, note: "costControl.ts" },
  ];
}

function ReleaseChecklist({ rows }: { rows: CheckRow[] }) {
  const done  = rows.filter((r) => r.done).length;
  const total = rows.length;
  const pct   = Math.round((done / total) * 100);

  return (
    <div>
      {/* Header + bar */}
      <div className="flex items-baseline justify-between mb-2">
        <SectionLabel>C · Release Readiness</SectionLabel>
        <p className="text-[10px] tabular-nums text-white/25 mb-3">
          {pct}%
        </p>
      </div>
      <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden mb-4">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500/60 to-emerald-400/60 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Items */}
      <div className="rounded-xl border border-white/[0.05] overflow-hidden divide-y divide-white/[0.04]">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-center gap-3 px-4 py-2.5 bg-white/[0.015]"
          >
            {/* Circle check */}
            <div
              className={`shrink-0 h-4 w-4 rounded-full border flex items-center justify-center
                ${r.done
                  ? "border-emerald-400/50 bg-emerald-400/10"
                  : "border-white/[0.12]"
                }`}
            >
              {r.done && (
                <svg className="w-2 h-2 text-emerald-400" viewBox="0 0 8 8" fill="none">
                  <path
                    d="M1.5 4l2 2 3-3"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className={`text-[12.5px] truncate ${
                  r.done ? "text-white/60" : "text-white/40"
                }`}
              >
                {r.label}
              </p>
              {r.note && (
                <p className="text-[10px] text-white/22 truncate">{r.note}</p>
              )}
            </div>
            {!r.done && (
              <span className="shrink-0 text-[9.5px] uppercase tracking-[0.16em] text-yellow-300/60">
                Needs test
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export function DevDashboard(props: DevDashboardProps) {
  const systemRows   = useMemo(() => buildSystemRows(props),   [JSON.stringify(props)]);
  const costRows     = useMemo(() => buildCostRows(props),     [JSON.stringify(props)]);
  const checkRows    = useMemo(() => buildCheckRows(props),    [JSON.stringify(props)]);

  const activeSystem = systemRows.filter((r) => r.status === "active").length;
  const donePct      = Math.round(
    (checkRows.filter((r) => r.done).length / checkRows.length) * 100
  );

  const depthOverride = props.depthOverride ?? "auto";
  const effectiveDepth =
    depthOverride === "auto"
      ? (props.relationshipStage ?? "new")
      : depthOverride;

  return (
    <div className="space-y-7 pb-6">
      {/* Dev actions */}
      {props.onNewTestChat && (
        <div>
          <SectionLabel>Dev Actions</SectionLabel>
          <button
            type="button"
            onClick={props.onNewTestChat}
            className="w-full rounded-xl border border-amber-400/20 bg-amber-400/[0.05] px-4 py-2.5 text-left transition hover:bg-amber-400/[0.09] active:scale-[0.98]"
          >
            <p className="text-[12.5px] text-amber-300/80 font-medium">New Test Chat</p>
            <p className="text-[10px] text-amber-300/35 mt-0.5">
              Clears conversation only · memories, profile &amp; relationship unchanged
            </p>
          </button>
        </div>
      )}

      {/* Top summary strip */}
      <div className="flex gap-3">
        <div className="flex-1 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-center">
          <p className="text-[9px] uppercase tracking-[0.28em] text-white/25 mb-0.5">Systems</p>
          <p className="text-[18px] font-light text-white/75">
            {activeSystem}
            <span className="text-white/25 text-[12px]">/{systemRows.length}</span>
          </p>
        </div>
        <div className="flex-1 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-center">
          <p className="text-[9px] uppercase tracking-[0.28em] text-white/25 mb-0.5">Cost mode</p>
          <p
            className={`text-[18px] font-light truncate ${
              MODE_COLOR[(props.costMode ?? "cheap").toUpperCase()] ?? "text-white/75"
            }`}
          >
            {(props.costMode ?? "cheap").toLowerCase()}
          </p>
        </div>
        <div className="flex-1 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-center">
          <p className="text-[9px] uppercase tracking-[0.28em] text-white/25 mb-0.5">Ready</p>
          <p className="text-[18px] font-light text-white/75">{donePct}%</p>
        </div>
      </div>

      <RelationshipDepthOverride
        current={depthOverride}
        effective={effectiveDepth}
        onChange={props.onDepthOverrideChange ?? (() => {})}
      />

      <SystemHealth rows={systemRows} />
      <CostHealth rows={costRows} mode={props.costMode ?? "cheap"} />
      <ReleaseChecklist rows={checkRows} />

      <p className="text-center text-[9px] uppercase tracking-[0.3em] text-white/12 pt-1">
        Development only · Not shown in production
      </p>
    </div>
  );
}
