// ---------------------------------------------------------------------------
// Family Memory Retrieval — with Pet Classification Fix
// ---------------------------------------------------------------------------
// Direct family questions must return EVERY human family member, not pets.
// Pets are tracked separately and surfaced as an optional aside when the user
// asks about family ("I also remember your pets separately: dog Rio…").
//
// Pure TypeScript. No AI calls, no embeddings, no vector search.

export type FamilyMemory = {
  memory?: string;
  text?: string;
  category?: string;
  type?: string;
  entityName?: string;
  entityType?: string;
  [key: string]: any;
};

// ─── Family-intent detection ───────────────────────────────────────────────────

const FAMILY_QUERY_PATTERNS: RegExp[] = [
  /\bfamily\b/i,
  /\brelatives?\b/i,
  /\bwife\b/i,
  /\bhusband\b/i,
  /\bpartner\b/i,
  /\bspouse\b/i,
  /\b(child|children|kid|kids|son|sons|daughter|daughters)\b/i,
  /\b(parent|parents|mother|mom|father|dad)\b/i,
  /\b(brother|sister|sibling|siblings)\b/i,
  // Polish
  /\brodzin/i,            // rodzina, rodzinę, rodzinie
  /\bżon/i,               // żona, żonie
  /\bmąż\b/i, /\bmęża\b/i,
  /\bdzieck/i, /\bdzieci\b/i,
  /\bsyn/i,               // syn, syna, synowie
  /\bcórk/i,              // córka, córki
  /\b(mama|mamy|tata|taty|ojciec|matka)\b/i,
  /\b(brat|siostra|rodzeństwo)\b/i,
];

/** True when the user is explicitly asking about family / relatives. */
export function isFamilyQuery(message: string): boolean {
  const m = (message ?? "").toString();
  if (!m.trim()) return false;
  return FAMILY_QUERY_PATTERNS.some((re) => re.test(m));
}

// ─── Family-memory identification ───────────────────────────────────────────────

// ─── Pet detection (always excluded from family results) ─────────────────────

const PET_ENTITY_TYPES = new Set([
  "dog", "cat", "pet", "animal", "bird", "rabbit", "fish", "hamster",
]);

const PET_WORDS = [
  "dog", "cat", "pet", "puppy", "kitten", "parrot", "rabbit", "fish",
  "hamster", "guinea pig",
  // Polish
  "pies", "psa", "psu", "psom", "kot", "kota", "kotu", "kotem",
  "zwierzę", "zwierzak", "szczeniak", "kociak",
];

const PET_QUERY_PATTERNS: RegExp[] = [
  /\bpets?\b/i,
  /\bdogs?\b/i,
  /\bcats?\b/i,
  /\banimals?\b/i,
  /\bpuppy\b/i, /\bkitten\b/i,
  // Polish
  /\bpies\b/i, /\bpsa\b/i, /\bkot\b/i, /\bzwierzę\b/i, /\bzwierzak\b/i,
];

function getText(m: FamilyMemory): string {
  return (m.memory ?? m.text ?? "").toString();
}

/** True if a memory is about a pet (not a human). */
export function isPetMemory(m: FamilyMemory): boolean {
  const category = (m.category ?? "").toLowerCase();
  const entityType = (m.entityType ?? "").toLowerCase();
  if (category === "pet" || category === "animal") return true;
  if (PET_ENTITY_TYPES.has(entityType)) return true;
  const lower = getText(m).toLowerCase();
  return PET_WORDS.some((w) => lower.includes(w));
}

/** True when the user is asking specifically about pets / animals. */
export function isPetQuery(message: string): boolean {
  const m = (message ?? "").toString();
  return PET_QUERY_PATTERNS.some((re) => re.test(m));
}

// ─── Human family classification ──────────────────────────────────────────────

const FAMILY_ROLE_WORDS = [
  "wife", "husband", "partner", "spouse", "son", "daughter", "child",
  "children", "kid", "kids", "mother", "father", "mom", "dad", "parent",
  "brother", "sister", "sibling", "family", "grandmother", "grandfather",
  // Polish
  "żona", "mąż", "syn", "córka", "dziecko", "dzieci", "rodzina", "mama",
  "tata", "ojciec", "matka", "brat", "siostra", "babcia", "dziadek",
];

const FAMILY_ENTITY_TYPES = new Set([
  "wife", "husband", "son", "daughter", "family", "partner", "mother",
  "father", "brother", "sister",
]);

/** True if a memory is about a HUMAN family member (pets excluded). */
export function isFamilyMemory(m: FamilyMemory): boolean {
  // Pets are never family members for retrieval purposes.
  if (isPetMemory(m)) return false;

  const category = (m.category ?? "").toLowerCase();
  const entityType = (m.entityType ?? "").toLowerCase();
  if (category === "family") return true;
  if (FAMILY_ENTITY_TYPES.has(entityType)) return true;

  const lower = getText(m).toLowerCase();
  return FAMILY_ROLE_WORDS.some((w) => lower.includes(w));
}

// ─── Pet summary note (injected alongside family results) ────────────────────

/**
 * Build a short, natural aside listing known pets — surfaced when the user
 * asks about family so INNER acknowledges pets without mixing them in.
 * Returns empty string if no pet memories exist.
 */
export function buildPetNote(memories: FamilyMemory[]): string {
  const pets = memories.filter(isPetMemory);
  if (pets.length === 0) return "";

  // Extract short descriptions: prefer entityName, else first few words.
  const descriptions = pets.map((m) => {
    const name = m.entityName;
    const text = getText(m).toLowerCase();
    // Try to read "dog Rio" / "cat Luna" patterns.
    const match = text.match(/\b(dog|cat|puppy|kitten|pies|kot)\s+(\p{L}+)/u);
    if (match) return `${match[1]} ${match[2]}`;
    if (name) return name;
    return getText(m).slice(0, 30).trim();
  });

  // Deduplicate.
  const unique = [...new Set(descriptions)];

  if (unique.length === 1) {
    return `I also remember your pet separately: ${unique[0]}.`;
  }
  return `I also remember your pets separately: ${unique.join(", ")}.`;
}

// ─── Duplicate entity normalization ─────────────────────────────────────────────

// Strip common Polish case endings so inflected forms map to one stem.
// e.g. "kevina" -> "kevin", "córki" -> "córk".
function nameStem(name: string): string {
  let s = name.toLowerCase().replace(/[^a-ząćęłńóśźż]/gi, "");
  // Remove trailing inflection vowels/suffixes (longest first).
  s = s.replace(/(owie|ami|owi|em|ie|ą|ę|y|a|i|e|u|o)$/u, "");
  return s;
}

// Try to pull the proper name out of a memory like "User's son is named Kevin".
function extractName(text: string): string | null {
  const patterns: RegExp[] = [
    /\bnamed\s+(\p{L}+)/u,
    /\bcalled\s+(\p{L}+)/u,
    /\bma na imię\s+(\p{L}+)/iu,
    /\b(?:is|to)\s+(\p{Lu}\p{L}+)\b/u,
  ];
  for (const re of patterns) {
    const match = text.match(re);
    if (match?.[1]) return match[1];
  }
  return null;
}

function roleKey(m: FamilyMemory): string {
  const entityType = (m.entityType ?? "").toLowerCase();
  if (FAMILY_ENTITY_TYPES.has(entityType)) return entityType;
  const lower = getText(m).toLowerCase();
  for (const role of ["wife", "husband", "son", "daughter", "mother", "father",
    "brother", "sister", "żona", "mąż", "syn", "córka"]) {
    if (lower.includes(role)) return role;
  }
  return "other";
}

/**
 * Collapse duplicate family entities. Two memories about the same role whose
 * extracted names share a stem (e.g. "Kevin" / "Kevina") are treated as the
 * same person — only the first (or longest-named) is kept.
 */
export function dedupeFamilyEntities(memories: FamilyMemory[]): FamilyMemory[] {
  const seen = new Map<string, FamilyMemory>(); // key -> kept memory
  const result: FamilyMemory[] = [];

  for (const m of memories) {
    const text = getText(m).trim();
    if (!text) continue;

    const role = roleKey(m);
    const name = m.entityName ?? extractName(text);
    const key = name ? `${role}:${nameStem(name)}` : `text:${text.toLowerCase()}`;

    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, m);
      result.push(m);
      continue;
    }

    // Duplicate entity — keep the variant with the longer proper name (more
    // canonical, e.g. prefer the spelled-out form), otherwise keep existing.
    const existingName = existing.entityName ?? extractName(getText(existing)) ?? "";
    if ((name ?? "").length > existingName.length) {
      const idx = result.indexOf(existing);
      if (idx >= 0) result[idx] = m;
      seen.set(key, m);
    }
  }

  return result;
}

/**
 * Returns ALL human family memories (deduped, pets excluded) — used when the
 * user explicitly asks about family members.
 */
export function getAllFamilyMemories(memories: FamilyMemory[]): FamilyMemory[] {
  return dedupeFamilyEntities(memories.filter(isFamilyMemory));
}

/**
 * Returns all pet memories — used when the user asks about pets / animals.
 */
export function getAllPetMemories(memories: FamilyMemory[]): FamilyMemory[] {
  return memories.filter(isPetMemory);
}
