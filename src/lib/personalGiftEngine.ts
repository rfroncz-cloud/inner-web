// ---------------------------------------------------------------------------
// Personal Gift Engine v1
// ---------------------------------------------------------------------------
// Suggests small, personal gift ideas when an important life event is detected.
// Pure TypeScript — no AI calls, no auto-sending. Uses existing memories only.
// Ideas are generated locally from rules keyed on event category + tone.

import type { LifeEvent, LifeEventCategory } from "@/lib/lifeEvents";

export type GiftCategory = "message" | "reflection" | "playlist" | "plan" | "surprise";
export type EmotionalTone = "warm" | "funny" | "proud" | "calm" | "deep";

export type PersonalGiftIdea = {
  title: string;
  description: string;
  category: GiftCategory;
  emotionalTone: EmotionalTone;
};

type MemoryLike = {
  memory?: string;
  type?: string;
  category?: string;
};

// ---------------------------------------------------------------------------
// Idea banks per event category
// ---------------------------------------------------------------------------

type IdeaTemplate = Omit<PersonalGiftIdea, "description"> & {
  descriptionTemplate: (context: string) => string;
};

const IDEA_BANKS: Record<LifeEventCategory, IdeaTemplate[]> = {
  birthday: [
    {
      title: "Personal birthday message",
      descriptionTemplate: (ctx) =>
        ctx
          ? `Write a message that reflects on ${ctx} and what makes this birthday meaningful.`
          : "Write a short, honest birthday message — not generic, just real.",
      category: "message",
      emotionalTone: "warm",
    },
    {
      title: "Year in reflection",
      descriptionTemplate: () =>
        "Create a quiet reflection of what this past year held — wins, hard parts, and what grew.",
      category: "reflection",
      emotionalTone: "deep",
    },
    {
      title: "Small celebration plan",
      descriptionTemplate: () =>
        "Suggest a simple way to mark the day — something low-effort but genuinely enjoyable.",
      category: "plan",
      emotionalTone: "calm",
    },
  ],

  anniversary: [
    {
      title: "Anniversary message",
      descriptionTemplate: (ctx) =>
        ctx
          ? `Write a message that touches on ${ctx} and what this relationship has meant.`
          : "Write something honest about what this time together has meant.",
      category: "message",
      emotionalTone: "warm",
    },
    {
      title: "Memory reflection",
      descriptionTemplate: () =>
        "Look back at a shared memory that stands out — and why it still matters.",
      category: "reflection",
      emotionalTone: "deep",
    },
    {
      title: "Next chapter plan",
      descriptionTemplate: () =>
        "Think about one thing you both want to do or experience together soon.",
      category: "plan",
      emotionalTone: "calm",
    },
  ],

  milestone: [
    {
      title: "Proud milestone note",
      descriptionTemplate: (ctx) =>
        ctx
          ? `Capture what it took to reach this — especially ${ctx}.`
          : "Capture what it actually took to reach this moment — be honest about the effort.",
      category: "message",
      emotionalTone: "proud",
    },
    {
      title: "Progress summary",
      descriptionTemplate: () =>
        "Write down where you started, what you learned, and what shifted along the way.",
      category: "reflection",
      emotionalTone: "deep",
    },
    {
      title: "Next step plan",
      descriptionTemplate: () =>
        "Decide on one clear next step to keep the momentum without overwhelming yourself.",
      category: "plan",
      emotionalTone: "calm",
    },
  ],

  project: [
    {
      title: "Project launch note",
      descriptionTemplate: (ctx) =>
        ctx
          ? `Write a short note on why ${ctx} matters and what you want it to become.`
          : "Write a short note on why this project matters and what you hope it becomes.",
      category: "message",
      emotionalTone: "proud",
    },
    {
      title: "Progress reflection",
      descriptionTemplate: () =>
        "Note what's working, what's hard, and what you've learned so far.",
      category: "reflection",
      emotionalTone: "calm",
    },
    {
      title: "First milestone plan",
      descriptionTemplate: () =>
        "Define the smallest meaningful milestone — something you can actually reach in the next two weeks.",
      category: "plan",
      emotionalTone: "calm",
    },
  ],

  goal: [
    {
      title: "Goal intention note",
      descriptionTemplate: (ctx) =>
        ctx
          ? `Write down why ${ctx} matters to you — not the tactics, just the reason.`
          : "Write down why this goal matters to you — the real reason, not the practical one.",
      category: "message",
      emotionalTone: "deep",
    },
    {
      title: "Commitment plan",
      descriptionTemplate: () =>
        "Pick one small action you can take this week. Just one.",
      category: "plan",
      emotionalTone: "calm",
    },
  ],

  family: [
    {
      title: "Family moment note",
      descriptionTemplate: (ctx) =>
        ctx
          ? `Write something about ${ctx} and what they mean to you.`
          : "Write something honest about this family moment — what it means, what it felt like.",
      category: "message",
      emotionalTone: "warm",
    },
    {
      title: "Memory capture",
      descriptionTemplate: () =>
        "Describe this moment simply — so you'll remember it clearly years from now.",
      category: "reflection",
      emotionalTone: "warm",
    },
  ],
};

// ---------------------------------------------------------------------------
// Context extractor
// ---------------------------------------------------------------------------

// Pulls a short relevant phrase from memories to personalise the description.
function extractContext(memories: MemoryLike[]): string {
  const useful = memories
    .map((m) => (m.memory ?? "").trim())
    .filter((t) => t.length > 8 && t.length < 80 && !t.endsWith("?"))
    .slice(0, 3);

  if (useful.length === 0) return "";

  // Prefer goal/project/family memories for context.
  const preferred = useful.find((t) => {
    const lower = t.toLowerCase();
    return (
      lower.includes("goal") ||
      lower.includes("build") ||
      lower.includes("project") ||
      lower.includes("launch") ||
      lower.includes("wife") ||
      lower.includes("son") ||
      lower.includes("daughter") ||
      lower.includes("inner")
    );
  });

  const chosen = preferred ?? useful[0];
  // Strip "User" prefix for natural phrasing.
  return chosen.replace(/^User'?s?\s+/i, "").replace(/^User\s+/i, "").toLowerCase();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generates up to `limit` personalised gift ideas for a life event, using
 * existing memories for context. Pure local logic, no AI calls.
 */
export function generateGiftIdeasForEvent(
  event: LifeEvent,
  memories: MemoryLike[],
  limit = 3
): PersonalGiftIdea[] {
  const templates = IDEA_BANKS[event.category] ?? IDEA_BANKS.milestone;
  const context = extractContext(memories);

  return templates.slice(0, limit).map((t) => ({
    title: t.title,
    description: t.descriptionTemplate(context),
    category: t.category,
    emotionalTone: t.emotionalTone,
  }));
}
