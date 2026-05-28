"use client";

import { useEffect, useMemo, useState } from "react";
import {
  extractLifeEventsFromMemories,
  getUpcomingLifeEvents,
  getImportantRecentEvents,
  formatEventDate,
  eventEmoji,
} from "@/lib/lifeEvents";
import { generateGiftIdeasForEvent } from "@/lib/personalGiftEngine";
import type { LifeEvent, LifeEventCategory } from "@/lib/lifeEvents";

type MemoryLike = {
  memory?: string;
  type?: string;
  category?: string;
  createdAt?: string;
  created_at?: string;
};

type Props = {
  memories: MemoryLike[];
  loading?: boolean;
};

function SectionTitle({ title }: { title: string }) {
  return (
    <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-violet-200/40">
      {title}
    </p>
  );
}

// Categories that warrant gift idea suggestions — not every memory.
const GIFT_ELIGIBLE: Set<LifeEventCategory> = new Set([
  "birthday",
  "milestone",
  "anniversary",
  "goal",
]);

function GiftIdeas({
  event,
  memories,
}: {
  event: LifeEvent;
  memories: MemoryLike[];
}) {
  // "open" = ideas visible; "dismissed" = permanently hidden for this session.
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Only eligible categories get this feature.
  if (!GIFT_ELIGIBLE.has(event.category)) return null;
  // User dismissed — respect it silently.
  if (dismissed) return null;

  // Generate at most 3 ideas, only when open (lazy).
  const ideas = useMemo(
    () =>
      open ? generateGiftIdeasForEvent(event, memories, 3) : [],
    [open, event, memories]
  );

  return (
    <div className="mt-2.5">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-[10px] uppercase tracking-[0.22em] text-violet-300/40 hover:text-violet-200/65 transition"
        >
          Small ideas for this moment
        </button>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] uppercase tracking-[0.22em] text-violet-200/40">
              Small ideas for this moment
            </p>
            <button
              type="button"
              onClick={() => { setOpen(false); setDismissed(true); }}
              className="text-[10px] uppercase tracking-[0.18em] text-white/20 hover:text-white/45 transition"
            >
              Dismiss
            </button>
          </div>

          {ideas.length > 0 && (
            <ul className="space-y-1.5">
              {ideas.map((idea) => (
                <li
                  key={idea.title}
                  className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3"
                >
                  <p className="text-[12px] text-white/65">{idea.title}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="py-3">
      <div className="h-3 w-2/3 rounded-full bg-white/[0.06] animate-pulse" />
    </div>
  );
}

export function LifeEventsPanel({ memories, loading = false }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const events = useMemo(() => {
    if (!mounted) return [];
    return extractLifeEventsFromMemories((memories ?? []) as MemoryLike[]);
  }, [mounted, memories]);

  const upcoming = useMemo(() => getUpcomingLifeEvents(events), [events]);
  const milestones = useMemo(
    () => getImportantRecentEvents(events),
    [events]
  );

  if (!mounted) {
    return (
      <div className="pt-1">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    );
  }

  if (loading && events.length === 0) {
    return (
      <div className="pt-1">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="mt-8 px-2 py-12 text-center">
        <p className="text-[14px] leading-relaxed text-white/50">
          No important life events yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-9 pt-1">
      {upcoming.length > 0 && (
        <section>
          <SectionTitle title="Upcoming" />
          <div className="divide-y divide-white/[0.05]">
            {upcoming.map((e) => {
              const dateLabel = formatEventDate(e.date);
              return (
                <div key={e.id} className="py-3.5 first:pt-0">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[13px] leading-relaxed text-white/75">
                      {eventEmoji(e.category)} {e.title}
                      {dateLabel ? ` — ${dateLabel}` : ""}
                    </span>
                    <span className="shrink-0 text-[10px] tracking-[0.04em] text-white/25">
                      {e.daysUntil === 0
                        ? "Today"
                        : e.daysUntil === 1
                        ? "Tomorrow"
                        : `in ${e.daysUntil} days`}
                    </span>
                  </div>
                  <GiftIdeas event={e} memories={memories} />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {milestones.length > 0 && (
        <section>
          <SectionTitle title="Recent Milestones" />
          <div className="divide-y divide-white/[0.05]">
            {milestones.map((e) => (
              <div key={e.id} className="py-3.5 first:pt-0">
                <span className="text-[13px] leading-relaxed text-white/75">
                  {eventEmoji(e.category)} {e.title}
                </span>
                <GiftIdeas event={e} memories={memories} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
