// ---------------------------------------------------------------------------
// Family Memory Retrieval — with Pet Classification Fix
// ---------------------------------------------------------------------------
// Direct family questions must return EVERY human family member, not pets.
// Pets are tracked separately and surfaced as an optional aside when the user
// asks about family ("I also remember your pets separately: dog Rio…").
//
// Pure TypeScript. No AI calls, no embeddings, no vector search.

import {
  normalizeEntityType,
  genderForEntityType,
  familyNameStem,
  pickCanonicalName,
  mergeFamilyEntities,
  type CanonicalFamilyEntity,
} from "@/lib/familyEntityNormalization";

export type FamilyMemory = {
  memory?: string;
  text?: string;
  category?: string;
  type?: string;
  entityName?: string;
  entityType?: string;
  // Family Entity Normalization v1 — populated by dedupeFamilyEntities so
  // downstream retrieval always works off the canonical entity, not a variant.
  canonicalName?: string;
  aliases?: string[];
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

// ─── Family Entity Normalization v1 ──────────────────────────────────────────
// The same person can appear under many Polish grammatical forms (Kevin /
// Kevina / Kevinowi / Kevinem). We fold every variant onto one canonical entity
// before retrieval, so the family list never double-counts a person and always
// surfaces the canonical (nominative) name. See familyEntityNormalization.ts.

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

const PL_ROLE_WORDS = [
  "wife", "husband", "son", "daughter", "mother", "father", "brother",
  "sister", "grandmother", "grandfather",
  "żona", "zona", "mąż", "maz", "syn", "córka", "corka", "matka", "mama",
  "ojciec", "tata", "brat", "siostra", "babcia", "dziadek",
];

/** Canonical role for a memory, from its entityType or its text. */
function roleKey(m: FamilyMemory): string {
  const fromType = normalizeEntityType(m.entityType);
  if (fromType !== "family") return fromType;
  const lower = getText(m).toLowerCase();
  for (const role of PL_ROLE_WORDS) {
    if (lower.includes(role)) return normalizeEntityType(role);
  }
  return "family";
}

/** Replace the surface name in a memory's text with its canonical form. */
function rewriteNameInText(text: string, surface: string, canonical: string): string {
  if (!surface || !canonical || surface === canonical) return text;
  const escaped = surface.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(new RegExp(escaped, "iu"), canonical);
}

/**
 * Build canonical family entities (entityType, canonicalName, aliases) from a
 * set of memories — every grammatical variant of a person merged into one.
 */
export function buildFamilyEntities(
  memories: FamilyMemory[]
): CanonicalFamilyEntity[] {
  const inputs = memories
    .filter(isFamilyMemory)
    .map((m) => ({
      name: m.entityName ?? extractName(getText(m)) ?? "",
      entityType: roleKey(m),
    }))
    .filter((i) => i.name);
  return mergeFamilyEntities(inputs);
}

/**
 * Collapse duplicate family entities. Memories about the same role whose names
 * are grammatical variants (e.g. "Kevin" / "Kevina" / "Kevinowi") are treated
 * as one person: a single memory is kept, its name rewritten to the canonical
 * (nominative) form, and every variant retained on `aliases`.
 */
export function dedupeFamilyEntities(memories: FamilyMemory[]): FamilyMemory[] {
  type Bucket = { name: string; aliases: string[] };
  const buckets = new Map<string, Bucket>();
  const kept = new Map<string, FamilyMemory>();
  const order: string[] = [];

  for (const m of memories) {
    const text = getText(m).trim();
    if (!text) continue;

    const role = roleKey(m);
    const name = m.entityName ?? extractName(text) ?? "";
    const key = name ? `${role}:${familyNameStem(name)}` : `text:${text.toLowerCase()}`;

    const bucket = buckets.get(key);
    if (!bucket) {
      buckets.set(key, { name, aliases: name ? [name] : [] });
      kept.set(key, m);
      order.push(key);
    } else if (name && !bucket.aliases.some((a) => a.toLowerCase() === name.toLowerCase())) {
      bucket.aliases.push(name);
    }
  }

  return order.map((key) => {
    const m = kept.get(key)!;
    const bucket = buckets.get(key)!;
    const role = roleKey(m);
    if (!bucket.name) return m;

    const canonicalName = pickCanonicalName(bucket.aliases, genderForEntityType(role));
    const surface = m.entityName ?? extractName(getText(m)) ?? bucket.name;
    return {
      ...m,
      entityType: role,
      entityName: canonicalName,
      canonicalName,
      aliases: bucket.aliases,
      memory: rewriteNameInText(getText(m), surface, canonicalName),
    };
  });
}

/**
 * Family Entity Deduplication v1 — collapse duplicate family people inside a
 * FULL memory pool (family + non-family), in place. Duplicate persons (same
 * role + same canonical name, e.g. "Kevin" / "Kevina") are merged: the first
 * occurrence survives with its name rewritten to canonical, later duplicates
 * are dropped. Non-family memories and nameless family memories are preserved
 * in their original positions.
 *
 * Use this BEFORE any retrieval / summary so the model never receives one
 * person twice. Pure local logic — no DB writes, no AI calls.
 */
export function dedupeFamilyInMemoryPool(memories: FamilyMemory[]): FamilyMemory[] {
  const family = memories.filter(isFamilyMemory);
  if (family.length < 2) return memories;

  // Pass 1 — gather every alias per (role + stem) so the canonical name is
  // chosen from all variants, not just the first one seen.
  const aliasGroups = new Map<string, string[]>();
  for (const m of family) {
    const name = m.entityName ?? extractName(getText(m)) ?? "";
    if (!name) continue;
    const key = `${roleKey(m)}:${familyNameStem(name)}`;
    const aliases = aliasGroups.get(key) ?? [];
    if (!aliases.some((a) => a.toLowerCase() === name.toLowerCase())) {
      aliases.push(name);
    }
    aliasGroups.set(key, aliases);
  }

  // Pass 2 — rebuild the pool, keeping one canonicalized memory per person.
  const emitted = new Set<string>();
  const result: FamilyMemory[] = [];
  for (const m of memories) {
    if (!isFamilyMemory(m)) {
      result.push(m);
      continue;
    }
    const name = m.entityName ?? extractName(getText(m)) ?? "";
    if (!name) {
      result.push(m); // family memory with no extractable person — keep as-is
      continue;
    }
    const role = roleKey(m);
    const key = `${role}:${familyNameStem(name)}`;
    if (emitted.has(key)) continue; // duplicate person — drop
    emitted.add(key);

    const aliases = aliasGroups.get(key) ?? [name];
    const canonicalName = pickCanonicalName(aliases, genderForEntityType(role));
    result.push({
      ...m,
      entityType: role,
      entityName: canonicalName,
      canonicalName,
      aliases,
      memory: rewriteNameInText(getText(m), name, canonicalName),
    });
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
