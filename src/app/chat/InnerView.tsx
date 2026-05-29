"use client";

import { useMemo, useState } from "react";
import { MemoryPanel } from "./MemoryPanel";
import { MemoryTimeline } from "./MemoryTimeline";
import { LifeEventsPanel } from "./LifeEventsPanel";
import { DevDashboard } from "./DevDashboard";
import { UserProfileReflection } from "./UserProfileReflection";
import { ProfileView } from "./ProfileView";
import { buildUserProfile, getProfileSummary } from "@/lib/userProfileEngine";

const IS_DEV = process.env.NODE_ENV === "development";

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

export type InnerViewTab =
  | "memory"
  | "timeline"
  | "life"
  | "reflection"
  | "profile"
  | "dev";

type Tab = InnerViewTab;

const BASE_TABS: { id: Tab; label: string }[] = [
  { id: "memory",     label: "Memory" },
  { id: "timeline",   label: "Timeline" },
  { id: "life",       label: "Life" },
  { id: "reflection", label: "Reflection" },
  { id: "profile",    label: "Profile" },
];

const DEV_TAB: { id: Tab; label: string } = { id: "dev", label: "Dev" };

const TABS = IS_DEV ? [...BASE_TABS, DEV_TAB] : BASE_TABS;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

// Shape matches chat-ui.tsx's LongTermMemory and MemoryPanel's MemoryLikeForPanel.
// No index signature so TypeScript catches genuine field mismatches.
type InnerMemory = {
  memory: string;
  type?: string;
  importance?: number;
  emotionalWeight?: number;
  emotional_weight?: number;
  repeatCount?: number;
  repeat_count?: number;
  createdAt?: string;
  created_at?: string;
  lastAccessed?: string;
  last_accessed?: string;
  category?: string;
  entityName?: string;
  emotionalLayer?: string;
  emotionalIntensity?: number;
  relationship_impact?: number;
};

type InnerViewProps = {
  memories: InnerMemory[];
  lastUserMessage?: string | null;
  loading?: boolean;
  onClearAll?: () => void;
  // Which tab to open on mount (driven by the app's visible navigation).
  initialTab?: InnerViewTab;
  // Dev dashboard runtime values — only used when NODE_ENV === "development".
  devProps?: {
    messagesCount?: number;
    relationshipStage?: string;
    conversationMode?: string;
    innerPresence?: string;
    costMode?: string;
    costMaxTokens?: number;
    costMaxMemoryLines?: number;
    model?: string;
  };
};

// ---------------------------------------------------------------------------
// Tab bar
// ---------------------------------------------------------------------------

function TabBar({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
}) {
  return (
    /* Horizontal scroll on narrow screens so all tabs are reachable */
    <div className="flex mb-6 border-b border-white/[0.06] overflow-x-auto scrollbar-none -mx-1 px-1">
      {TABS.map((t) => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            /* min-h-[44px] ensures a comfortable tap target on mobile */
            className={`
              relative shrink-0 min-h-[44px] flex items-end pb-3 px-4
              text-[10px] uppercase tracking-[0.24em] transition-colors whitespace-nowrap
              ${isActive ? "text-violet-200/90" : "text-white/30 hover:text-white/55"}
            `}
          >
            {t.label}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-px bg-violet-400/60" />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function InnerView({
  memories,
  lastUserMessage,
  loading = false,
  onClearAll,
  initialTab = "memory",
  devProps,
}: InnerViewProps) {
  // Opens at the tab chosen by the app's visible navigation; users can still
  // switch tabs within the drawer afterwards.
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  // Life events count for the dev dashboard (derived client-side, lazy).
  // Avoid importing lifeEvents here — it's already handled inside LifeEventsPanel.
  // Approximate by counting category-tagged memories for the dashboard.
  const lifeEventsCount = memories.filter(
    (m) =>
      m.category === "birthday" ||
      m.category === "family" ||
      m.type === "life_goal" ||
      m.type === "life_context"
  ).length;

  // User Profile Engine v1 — evolving, soft understanding of the user.
  // Pure local computation from existing memories; no AI calls.
  const userProfile = useMemo(() => buildUserProfile(memories), [memories]);
  const profileSummary = useMemo(() => getProfileSummary(userProfile), [userProfile]);

  return (
    <div className="flex flex-col min-h-0">
      <TabBar active={activeTab} onChange={setActiveTab} />

      <div className="flex-1 min-h-0">
        {activeTab === "memory" && (
          <MemoryPanel
            loading={loading}
            memories={memories}
            lastUserMessage={lastUserMessage}
            onClearAll={onClearAll}
            focus="remembered"
          />
        )}

        {activeTab === "timeline" && (
          <MemoryTimeline
            memories={memories}
            lastUserMessage={lastUserMessage}
            loading={loading}
          />
        )}

        {activeTab === "life" && (
          <LifeEventsPanel memories={memories} loading={loading} />
        )}

        {activeTab === "reflection" && (
          <div className="space-y-6">
            <UserProfileReflection profile={userProfile} summary={profileSummary} />
            <MemoryPanel
              loading={loading}
              memories={memories}
              lastUserMessage={lastUserMessage}
              focus="all"
            />
          </div>
        )}

        {activeTab === "profile" && (
          <ProfileView profile={userProfile} summary={profileSummary} />
        )}

        {IS_DEV && activeTab === "dev" && (
          <DevDashboard
            memoriesCount={memories.length}
            messagesCount={devProps?.messagesCount}
            relationshipStage={devProps?.relationshipStage}
            conversationMode={devProps?.conversationMode}
            innerPresence={devProps?.innerPresence}
            lifeEventsCount={lifeEventsCount}
            costMode={devProps?.costMode}
            costMaxTokens={devProps?.costMaxTokens}
            costMaxMemoryLines={devProps?.costMaxMemoryLines}
            model={devProps?.model}
          />
        )}
      </div>
    </div>
  );
}
