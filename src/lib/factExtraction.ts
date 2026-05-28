// ---------------------------------------------------------------------------
// Structured Fact Extraction Engine
// ---------------------------------------------------------------------------
// Turns a messy, multi-fact memory string into clean, single-fact records.
// Pure TypeScript regex/rules — no AI calls, no embeddings. Supports English
// and Polish phrasings.
//
//   "User's name is Radek, loves wife Ela, has dog Rio, 3 cats, lives in X."
//     -> Name: Radek / Wife: Ela / Dog: Rio / Cats: 3 / Location: X

export type StructuredFact = {
  type:
    | "name"
    | "location"
    | "pet"
    | "family"
    | "preference"
    | "goal"
    | "project"
    | "relationship"
    | "other";
  label: string;
  value: string;
  confidence: number;
};

const NAME = "A-Za-zÀ-ÿąćęłńóśźżĄĆĘŁŃÓŚŹŻ";
const PLACE = "A-Za-zÀ-ÿąćęłńóśźżĄĆĘŁŃÓŚŹŻ \\-";
// Stops a free-text value at a clause boundary (comma, period, "and", "i").
const PHRASE = "[^.,;]+?";

type Rule = {
  type: StructuredFact["type"];
  label: string;
  regexes: RegExp[];
  confidence: number;
  transform?: (value: string) => string;
  // When set, the captured group is treated as a numeric count.
  isCount?: boolean;
  // Reject the match if the cleaned value hits one of these words — keeps
  // generic "love" rules from swallowing "loves wife Ela".
  rejectIfValueIncludes?: string[];
};

function cleanValue(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/^[\s,;:.!?-]+/, "")
    .replace(/[\s,;:.!?-]+$/, "")
    .trim();
}

function titleName(value: string): string {
  const v = cleanValue(value);
  if (!v) return v;
  return v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
}

// Light PL->EN verb mapping so goals read naturally ("zbudować INNER" ->
// "Build INNER"). Only the leading verb is mapped; the rest is preserved so
// proper nouns like "INNER" keep their casing.
const GOAL_VERB_MAP: Record<string, string> = {
  zbudować: "Build",
  zbudowac: "Build",
  stworzyć: "Create",
  stworzyc: "Create",
  zrobić: "Make",
  zrobic: "Make",
  rozwijać: "Grow",
  rozwijac: "Grow",
  napisać: "Write",
  napisac: "Write",
  build: "Build",
  create: "Create",
  make: "Make",
  grow: "Grow",
  launch: "Launch",
};

function titlePhrase(value: string): string {
  const v = cleanValue(value);
  if (!v) return v;

  const parts = v.split(" ");
  const firstLower = parts[0].toLowerCase();
  if (GOAL_VERB_MAP[firstLower]) {
    parts[0] = GOAL_VERB_MAP[firstLower];
    return parts.join(" ");
  }

  return v.charAt(0).toUpperCase() + v.slice(1);
}

const RULES: Rule[] = [
  // --- Name ----------------------------------------------------------------
  {
    type: "name",
    label: "Name",
    confidence: 92,
    transform: titleName,
    regexes: [
      new RegExp(`\\bname\\s+is\\s+(?:named\\s+)?([${NAME}]+)`, "gi"),
      new RegExp(`\\bmy name is\\s+([${NAME}]+)`, "gi"),
      new RegExp(`\\bmam na imię\\s+([${NAME}]+)`, "gi"),
      new RegExp(`\\bmam na imie\\s+([${NAME}]+)`, "gi"),
      new RegExp(`\\bnazywam się\\s+([${NAME}]+)`, "gi"),
      new RegExp(`\\bnazywam sie\\s+([${NAME}]+)`, "gi"),
    ],
  },
  // --- Family --------------------------------------------------------------
  {
    type: "family",
    label: "Wife",
    confidence: 90,
    transform: titleName,
    regexes: [
      new RegExp(`\\bwife\\s+(?:is\\s+|named\\s+)?([${NAME}]+)`, "gi"),
      new RegExp(`\\bżona\\s+(?:ma na imię\\s+)?([${NAME}]+)`, "gi"),
      new RegExp(`\\bzona\\s+(?:ma na imie\\s+)?([${NAME}]+)`, "gi"),
    ],
  },
  {
    type: "family",
    label: "Husband",
    confidence: 90,
    transform: titleName,
    regexes: [
      new RegExp(`\\bhusband\\s+(?:is\\s+|named\\s+)?([${NAME}]+)`, "gi"),
      new RegExp(`\\bmąż\\s+(?:ma na imię\\s+)?([${NAME}]+)`, "gi"),
      new RegExp(`\\bmaz\\s+(?:ma na imie\\s+)?([${NAME}]+)`, "gi"),
    ],
  },
  {
    type: "family",
    label: "Son",
    confidence: 90,
    transform: titleName,
    regexes: [
      new RegExp(`\\bson\\s+(?:is\\s+|named\\s+)?([${NAME}]+)`, "gi"),
      new RegExp(`\\bsyn\\s+(?:ma na imię\\s+)?([${NAME}]+)`, "gi"),
      new RegExp(`\\bsyna\\s+(?:o imieniu\\s+)?([${NAME}]+)`, "gi"),
    ],
  },
  {
    type: "family",
    label: "Daughter",
    confidence: 90,
    transform: titleName,
    regexes: [
      new RegExp(`\\bdaughter\\s+(?:is\\s+|named\\s+)?([${NAME}]+)`, "gi"),
      new RegExp(`\\bcórka\\s+(?:ma na imię\\s+)?([${NAME}]+)`, "gi"),
      new RegExp(`\\bcorka\\s+(?:ma na imie\\s+)?([${NAME}]+)`, "gi"),
    ],
  },
  // --- Pets ----------------------------------------------------------------
  {
    type: "pet",
    label: "Dog",
    confidence: 90,
    transform: titleName,
    regexes: [
      new RegExp(`\\bdog\\s+(?:is\\s+|named\\s+|called\\s+)?([${NAME}]+)`, "gi"),
      new RegExp(`\\bpsa o imieniu\\s+([${NAME}]+)`, "gi"),
      new RegExp(`\\bpies\\s+(?:ma na imię\\s+)?([${NAME}]+)`, "gi"),
    ],
  },
  {
    type: "pet",
    label: "Cat",
    confidence: 90,
    transform: titleName,
    regexes: [
      new RegExp(`\\bcat\\s+(?:is\\s+|named\\s+|called\\s+)?([${NAME}]+)`, "gi"),
      new RegExp(`\\bkota o imieniu\\s+([${NAME}]+)`, "gi"),
      new RegExp(`\\bkot\\s+(?:ma na imię\\s+)?([${NAME}]+)`, "gi"),
    ],
  },
  {
    type: "pet",
    label: "Cats",
    confidence: 88,
    isCount: true,
    regexes: [
      /\bhave\s+(\d+)\s+cats?\b/gi,
      /\b(\d+)\s+cats?\b/gi,
      /\bmam\s+(\d+)\s+kot\w*/gi,
      /\b(\d+)\s+kot\w*/gi,
    ],
  },
  {
    type: "pet",
    label: "Dogs",
    confidence: 88,
    isCount: true,
    regexes: [
      /\bhave\s+(\d+)\s+dogs?\b/gi,
      /\bmam\s+(\d+)\s+ps\w*/gi,
    ],
  },
  // --- Location ------------------------------------------------------------
  {
    type: "location",
    label: "Location",
    confidence: 90,
    transform: titlePhrase,
    regexes: [
      new RegExp(`\\blives?\\s+in\\s+(${PHRASE})(?=[,.;]|\\sand\\b|\\si\\b|$)`, "gi"),
      new RegExp(`\\bi live in\\s+(${PHRASE})(?=[,.;]|$)`, "gi"),
      new RegExp(`\\bmieszkam w\\s+([${PLACE}]+?)(?=[,.;]|\\si\\b|$)`, "gi"),
    ],
  },
  // --- Goals ---------------------------------------------------------------
  {
    type: "goal",
    label: "Goal",
    confidence: 80,
    transform: titlePhrase,
    regexes: [
      new RegExp(`\\bmy goal is(?:\\s+to)?\\s+(${PHRASE})(?=[,.;]|$)`, "gi"),
      new RegExp(`\\bmy dream is(?:\\s+to)?\\s+(${PHRASE})(?=[,.;]|$)`, "gi"),
      new RegExp(`\\bmoim celem jest\\s+(${PHRASE})(?=[,.;]|$)`, "gi"),
      new RegExp(`\\bmoje marzenie to\\s+(${PHRASE})(?=[,.;]|$)`, "gi"),
    ],
  },
  // --- Projects ------------------------------------------------------------
  {
    type: "project",
    label: "Project",
    confidence: 80,
    transform: titlePhrase,
    regexes: [
      new RegExp(`\\bmy project is\\s+(${PHRASE})(?=[,.;]|$)`, "gi"),
      new RegExp(`\\bworking on\\s+(${PHRASE})(?=[,.;]|$)`, "gi"),
      new RegExp(`\\bpracuję nad\\s+(${PHRASE})(?=[,.;]|$)`, "gi"),
      new RegExp(`\\bpracuje nad\\s+(${PHRASE})(?=[,.;]|$)`, "gi"),
    ],
  },
  // --- Preferences ---------------------------------------------------------
  {
    type: "preference",
    label: "Likes",
    confidence: 65,
    transform: titlePhrase,
    rejectIfValueIncludes: [
      "wife",
      "husband",
      "son",
      "daughter",
      "dog",
      "cat",
      "żona",
      "zona",
      "mąż",
    ],
    regexes: [
      new RegExp(`\\bi love\\s+(${PHRASE})(?=[,.;]|$)`, "gi"),
      new RegExp(`\\bmy favou?rite\\s+(${PHRASE})(?=[,.;]|$)`, "gi"),
      new RegExp(`\\buwielbiam\\s+(${PHRASE})(?=[,.;]|$)`, "gi"),
      new RegExp(`\\blubię\\s+(${PHRASE})(?=[,.;]|$)`, "gi"),
      new RegExp(`\\blubie\\s+(${PHRASE})(?=[,.;]|$)`, "gi"),
    ],
  },
];

function factKey(fact: StructuredFact): string {
  return `${fact.type}:${fact.label.toLowerCase()}:${fact.value.toLowerCase()}`;
}

export function extractStructuredFacts(memoryText: string): StructuredFact[] {
  const text = (memoryText || "").trim();
  if (!text) return [];

  const facts: StructuredFact[] = [];
  const seen = new Set<string>();

  for (const rule of RULES) {
    for (const regex of rule.regexes) {
      // Reset lastIndex for safety on reused global regexes.
      regex.lastIndex = 0;
      const matches = text.matchAll(regex);
      for (const match of matches) {
        const captured = match[1];
        if (!captured) continue;

        let value = rule.isCount
          ? cleanValue(captured)
          : (rule.transform ? rule.transform(captured) : cleanValue(captured));

        if (!value) continue;
        if (value.length < 1) continue;

        if (
          rule.rejectIfValueIncludes &&
          rule.rejectIfValueIncludes.some((w) =>
            value.toLowerCase().includes(w)
          )
        ) {
          continue;
        }

        const fact: StructuredFact = {
          type: rule.type,
          label: rule.label,
          value,
          confidence: rule.confidence,
        };

        const key = factKey(fact);
        if (seen.has(key)) continue;
        seen.add(key);
        facts.push(fact);
      }
    }
  }

  return facts;
}

const LABEL_MAP: Record<string, string> = {
  name: "Name",
  location: "Location",
  home: "Location",
  dog: "Dog",
  dogs: "Dogs",
  cat: "Cat",
  cats: "Cats",
  wife: "Wife",
  husband: "Husband",
  son: "Son",
  daughter: "Daughter",
  goal: "Goal",
  dream: "Goal",
  project: "Project",
  preference: "Likes",
  likes: "Likes",
  birthday: "Birthday",
  relationship: "Relationship",
};

/** Normalizes a raw label/type string into a clean display label. */
export function normalizeFactLabel(label: string): string {
  const key = (label || "").trim().toLowerCase();
  if (LABEL_MAP[key]) return LABEL_MAP[key];
  if (!key) return "";
  return key.charAt(0).toUpperCase() + key.slice(1);
}

/** Renders a structured fact as a single clean line: "Label: Value". */
export function structuredFactToLine(fact: StructuredFact): string {
  return `${normalizeFactLabel(fact.label)}: ${fact.value}`;
}
