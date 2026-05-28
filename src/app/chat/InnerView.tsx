"use client";

import { useState } from "react";
import { MemoryPanel } from "./MemoryPanel";
import { MemoryTimeline } from "./MemoryTimeline";

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

type Tab = "memory" | "timeline" | "reflection" | "patterns";

const TABS: { id: Tab; label: string }[] = [
  { id: "memory", label: "Memory" },
  { id: "timeline", label: "Timeline" },
  { id: "reflection", label: "Reflection" },
  { id: "patterns", label: "Patterns" },
];

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
    <div className="flex gap-0 mb-8 border-b border-white/[0.06]">
      {TABS.map((t) => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`
              relative pb-3 px-4 text-[10px] uppercase tracking-[0.24em] transition-colors
              ${
                isActive
                  ? "text-violet-200/90"
                  : "text-white/30 hover:text-white/55"
              }
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
}: InnerViewProps) {
  // Tab state is always initialised to "memory" — avoids any SSR mismatch.
  const [activeTab, setActiveTab] = useState<Tab>("memory");

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

        {activeTab === "reflection" && (
          <MemoryPanel
            loading={loading}
            memories={memories}
            lastUserMessage={lastUserMessage}
            focus="all"
          />
        )}

        {activeTab === "patterns" && (
          <MemoryPanel
            loading={loading}
            memories={memories}
            lastUserMessage={lastUserMessage}
            focus="patterns"
          />
        )}
      </div>
    </div>
  );
}
