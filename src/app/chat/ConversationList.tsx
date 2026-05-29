"use client";

// ---------------------------------------------------------------------------
// Conversation List — Conversation System v1
// ---------------------------------------------------------------------------
// Lightweight localStorage-backed conversation switcher.
// No AI calls, no backend writes, no schema changes.
// Profile, memory, and relationship data remain global per user.

import { useEffect, useRef } from "react";

export type Conversation = {
  id: string;
  title: string;
  createdAt: string;
};

type Props = {
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onClose: () => void;
};

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onClose,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Close when clicking outside.
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  function formatDate(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  const sorted = [...conversations].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div
      ref={ref}
      className="
        absolute left-0 top-0 z-50 h-full w-72
        flex flex-col
        bg-[#08080C]/97 backdrop-blur-2xl
        border-r border-white/[0.06]
        shadow-[4px_0_40px_rgba(0,0,0,0.6)]
        animate-[slideInLeft_0.18s_ease-out]
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
        <p className="text-[11px] uppercase tracking-[0.28em] text-white/40">
          Conversations
        </p>
        <button
          type="button"
          onClick={onClose}
          className="text-white/25 hover:text-white/60 transition text-lg leading-none"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* New Chat button */}
      <div className="px-4 pt-3 pb-2">
        <button
          type="button"
          onClick={() => { onNew(); onClose(); }}
          className="
            w-full flex items-center gap-2.5
            rounded-xl border border-violet-400/20 bg-violet-500/[0.07]
            px-4 py-2.5
            text-left transition
            hover:bg-violet-500/[0.12] active:scale-[0.98]
          "
        >
          <span className="text-violet-300/70 text-[16px] leading-none">+</span>
          <span className="text-[12.5px] text-violet-300/75 font-medium tracking-[0.02em]">
            New Chat
          </span>
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5">
        {sorted.length === 0 && (
          <p className="text-center text-[11px] text-white/20 mt-8">
            No conversations yet.
          </p>
        )}
        {sorted.map((conv) => {
          const isActive = conv.id === activeId;
          return (
            <div
              key={conv.id}
              className={`
                group relative flex items-center gap-2 rounded-xl px-3 py-2.5
                cursor-pointer transition-all
                ${isActive
                  ? "bg-violet-500/[0.12] border border-violet-400/15"
                  : "border border-transparent hover:bg-white/[0.04]"
                }
              `}
              onClick={() => { onSelect(conv.id); onClose(); }}
            >
              <div className="min-w-0 flex-1">
                <p
                  className={`
                    text-[12.5px] truncate leading-snug
                    ${isActive ? "text-white/85" : "text-white/55 group-hover:text-white/70"}
                  `}
                >
                  {conv.title}
                </p>
                <p className="text-[10px] text-white/22 mt-0.5">
                  {formatDate(conv.createdAt)}
                </p>
              </div>

              {/* Delete — only visible on hover, only when not the sole conversation */}
              {conversations.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                  className="
                    shrink-0 opacity-0 group-hover:opacity-100 transition
                    text-white/25 hover:text-red-400/70 text-[13px] leading-none px-1
                  "
                  aria-label="Delete conversation"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="px-5 py-3 border-t border-white/[0.04]">
        <p className="text-[9.5px] text-white/18 tracking-wide">
          Memories &amp; profile are shared across all chats
        </p>
      </div>
    </div>
  );
}
