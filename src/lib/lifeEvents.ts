// ---------------------------------------------------------------------------
// Life Events & Important Dates Engine v1
// ---------------------------------------------------------------------------
// Extracts important life events (birthdays, milestones, family events, goals,
// projects, anniversaries) from memory text and surfaces upcoming / recent
// ones. Pure TypeScript regex/rules — no AI calls, no calendar integration.
// Data stays local / memory-based.

export type LifeEventCategory =
  | "birthday"
  | "anniversary"
  | "goal"
  | "project"
  | "family"
  | "milestone";

export type LifeEvent = {
  id: string;
  title: string;
  category: LifeEventCategory;
  date?: string; // ISO date or a normalized "MM-DD"/free date string
  created_at: string;
  importance: number; // 0-100
};

type MemoryLike = {
  memory?: string;
  type?: string;
  category?: string;
  createdAt?: string;
  created_at?: string;
};

const NAME = "A-Za-zÀ-ÿąćęłńóśźżĄĆĘŁŃÓŚŹŻ";

// Base importance per category — birthdays / family / milestones rank highest.
const CATEGORY_IMPORTANCE: Record<LifeEventCategory, number> = {
  birthday: 90,
  family: 88,
  milestone: 85,
  anniversary: 82,
  goal: 70,
  project: 65,
};

const MONTHS: Record<string, number> = {
  january: 1, jan: 1, styczeń: 1, stycznia: 1,
  february: 2, feb: 2, luty: 2, lutego: 2,
  march: 3, mar: 3, marzec: 3, marca: 3,
  april: 4, apr: 4, kwiecień: 4, kwietnia: 4,
  may: 5, maj: 5, maja: 5,
  june: 6, jun: 6, czerwiec: 6, czerwca: 6,
  july: 7, jul: 7, lipiec: 7, lipca: 7,
  august: 8, aug: 8, sierpień: 8, sierpnia: 8,
  september: 9, sep: 9, sept: 9, wrzesień: 9, września: 9,
  october: 10, oct: 10, październik: 10, października: 10,
  november: 11, nov: 11, listopad: 11, listopada: 11,
  december: 12, dec: 12, grudzień: 12, grudnia: 12,
};

function cleanText(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

function hashId(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return `le_${h.toString(36)}`;
}

// Parses a free-text date like "12 July", "July 12", "12.07" into a normalized
// "MM-DD" string (year-agnostic). Returns undefined if nothing parses.
function parseDayMonth(text: string): string | undefined {
  const lower = text.toLowerCase();

  // "12 july" / "12 lipca"
  let m = lower.match(
    new RegExp(`\\b(\\d{1,2})\\s+([${NAME}]+)`, "i")
  );
  if (m) {
    const day = parseInt(m[1], 10);
    const month = MONTHS[m[2]];
    if (month && day >= 1 && day <= 31) {
      return `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  // "july 12" / "july 12th"
  m = lower.match(new RegExp(`\\b([${NAME}]+)\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, "i"));
  if (m) {
    const month = MONTHS[m[1]];
    const day = parseInt(m[2], 10);
    if (month && day >= 1 && day <= 31) {
      return `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  // "12.07" / "12/07" (day.month)
  m = lower.match(/\b(\d{1,2})[.\/](\d{1,2})\b/);
  if (m) {
    const day = parseInt(m[1], 10);
    const month = parseInt(m[2], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  return undefined;
}

type Rule = {
  category: LifeEventCategory;
  // If matched, builds a title from the capture (or the whole memory).
  test: RegExp;
  title: (memory: string, match: RegExpMatchArray) => string;
  wantsDate?: boolean;
};

const RULES: Rule[] = [
  // Birthdays
  {
    category: "birthday",
    test: /\b(my )?birthday( is| on)?\b|\burodziny\b|\burodzony\b|\burodzona\b/i,
    title: () => "Birthday",
    wantsDate: true,
  },
  // Anniversaries
  {
    category: "anniversary",
    test: /\banniversary\b|\brocznica\b|\bwedding\b|\bślub\b|\bslub\b/i,
    title: (memory) => cleanText(memory).replace(/^user'?s?\s+/i, "") || "Anniversary",
    wantsDate: true,
  },
  // Family milestones (birth of child, etc.)
  {
    category: "family",
    test: new RegExp(
      `\\b(son|daughter|child|baby|wife|husband)\\b.*\\b(born|married)\\b|\\b(urodził|urodzil|urodziła|urodzila)\\b`,
      "i"
    ),
    title: (memory) => cleanText(memory).replace(/^user'?s?\s+/i, ""),
  },
  // Project launches / milestones
  {
    category: "milestone",
    test: /\b(launched|shipped|released|finished|completed|started building)\b|\b(uruchomiłem|uruchomilem|wystartowałem|wystartowalem|skończyłem|skonczylem)\b/i,
    title: (memory) => cleanText(memory).replace(/^user'?s?\s+/i, "").replace(/^i\s+/i, ""),
  },
  // Projects
  {
    category: "project",
    test: /\b(my project|working on|building)\b|\b(mój projekt|pracuję nad|buduję)\b/i,
    title: (memory) => cleanText(memory).replace(/^user'?s?\s+/i, "").replace(/^i\s+/i, ""),
  },
  // Goals
  {
    category: "goal",
    test: /\b(my goal|my dream|i want to)\b|\b(moim celem|moje marzenie|chcę)\b/i,
    title: (memory) => cleanText(memory).replace(/^user'?s?\s+/i, "").replace(/^i\s+/i, ""),
  },
];

function capitalize(s: string): string {
  const t = s.trim();
  if (!t) return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/**
 * Extracts zero or more life events from a single memory string.
 * Deterministic — the same memory always yields the same events/ids.
 */
export function extractLifeEvents(memory: MemoryLike | string): LifeEvent[] {
  const raw = typeof memory === "string" ? memory : memory.memory ?? "";
  const text = cleanText(raw);
  if (!text || text.length < 4) return [];

  const createdAt =
    typeof memory === "string"
      ? new Date().toISOString()
      : memory.created_at ?? memory.createdAt ?? new Date().toISOString();

  const events: LifeEvent[] = [];
  const seen = new Set<string>();

  for (const rule of RULES) {
    const match = text.match(rule.test);
    if (!match) continue;

    const date = rule.wantsDate ? parseDayMonth(text) : undefined;
    const title = capitalize(rule.title(text, match));
    if (!title) continue;

    const id = hashId(`${rule.category}:${title.toLowerCase()}`);
    if (seen.has(id)) continue;
    seen.add(id);

    events.push({
      id,
      title,
      category: rule.category,
      date,
      created_at: createdAt,
      importance: CATEGORY_IMPORTANCE[rule.category],
    });

    // One memory usually represents one event; stop after the first strong
    // category match unless it was only a low-priority goal/project.
    if (rule.category !== "goal" && rule.category !== "project") break;
  }

  return events;
}

/** Extracts and de-duplicates life events across a list of memories. */
export function extractLifeEventsFromMemories(
  memories: MemoryLike[]
): LifeEvent[] {
  const all: LifeEvent[] = [];
  const seen = new Set<string>();
  for (const m of memories ?? []) {
    for (const e of extractLifeEvents(m)) {
      if (seen.has(e.id)) continue;
      seen.add(e.id);
      all.push(e);
    }
  }
  return all;
}

// Days until the next occurrence of a "MM-DD" date (this year or next).
function daysUntilNext(monthDay: string): number | null {
  const parts = monthDay.split("-");
  if (parts.length !== 2) return null;
  const month = parseInt(parts[0], 10);
  const day = parseInt(parts[1], 10);
  if (!month || !day) return null;

  const now = new Date();
  const year = now.getFullYear();
  let next = new Date(year, month - 1, day);
  // Normalize to midnight for stable day math.
  const today = new Date(year, now.getMonth(), now.getDate());
  if (next < today) {
    next = new Date(year + 1, month - 1, day);
  }
  const diff = next.getTime() - today.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

/**
 * Upcoming dated events (birthdays / anniversaries) within `withinDays`,
 * sorted by soonest first.
 */
export function getUpcomingLifeEvents(
  events: LifeEvent[],
  withinDays = 60
): (LifeEvent & { daysUntil: number })[] {
  const out: (LifeEvent & { daysUntil: number })[] = [];
  for (const e of events ?? []) {
    if (!e.date) continue;
    const days = daysUntilNext(e.date);
    if (days === null) continue;
    if (days <= withinDays) out.push({ ...e, daysUntil: days });
  }
  return out.sort((a, b) => a.daysUntil - b.daysUntil);
}

/**
 * Recent important events (milestones, family, launched projects, goals),
 * newest first, ranked by importance then recency.
 */
export function getImportantRecentEvents(
  events: LifeEvent[],
  limit = 8
): LifeEvent[] {
  return [...(events ?? [])]
    .filter((e) => e.importance >= 60)
    .sort((a, b) => {
      const t = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (t !== 0) return t;
      return b.importance - a.importance;
    })
    .slice(0, limit);
}

// Emoji + readable month for the UI layer.
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function formatEventDate(monthDay?: string): string | null {
  if (!monthDay) return null;
  const [m, d] = monthDay.split("-").map((x) => parseInt(x, 10));
  if (!m || !d) return null;
  return `${d} ${MONTH_NAMES[m - 1] ?? ""}`.trim();
}

export function eventEmoji(category: LifeEventCategory): string {
  switch (category) {
    case "birthday":
      return "🎂";
    case "anniversary":
      return "💍";
    case "family":
      return "👨‍👩‍👧";
    case "milestone":
      return "🚀";
    case "project":
      return "🛠️";
    case "goal":
      return "🎯";
    default:
      return "✨";
  }
}
