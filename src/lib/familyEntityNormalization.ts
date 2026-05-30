// ---------------------------------------------------------------------------
// Family Entity Normalization v1
// ---------------------------------------------------------------------------
// The same family member shows up under several Polish grammatical (case)
// forms — "Kevin / Kevina / Kevinowi / Kevinem" are all one son, "Ela / Eli /
// Elę / Elą" are all one daughter. Stored and retrieved naively, each inflected
// form looks like a different person.
//
// This module collapses every inflected surface form onto ONE canonical entity:
//
//   { entityType: "son", canonicalName: "Kevin",
//     aliases: ["Kevin", "Kevina", "Kevinowi", "Kevinem"] }
//
// Strategy (pure TypeScript — NO AI calls, NO embeddings):
//   1. Normalize the role word ("syn" -> "son") and derive grammatical gender
//      from it (son/husband -> masculine, daughter/wife -> feminine).
//   2. Fold each name to a stem by stripping Polish case endings, so all
//      variants of one person share a grouping key.
//   3. Pick the canonical name from the observed aliases by preferring the
//      nominative-looking form for that gender (masculine -> ends in a
//      consonant; feminine -> ends in "a"), reconstructing from the stem only
//      when no alias looks nominative.

export type FamilyGender = "masculine" | "feminine" | "unknown";

export type CanonicalFamilyEntity = {
  /** Canonical, language-neutral role, e.g. "son", "daughter", "wife". */
  entityType: string;
  /** The one true name for this person, e.g. "Kevin", "Ela". */
  canonicalName: string;
  /** Every surface form seen for this person, first-seen order. */
  aliases: string[];
};

// ─── Role normalization (PL/EN role word -> canonical English entityType) ─────

const ROLE_ALIASES: Record<string, string> = {
  // masculine
  son: "son", syn: "son", syna: "son", synowi: "son", synem: "son",
  husband: "husband", mąż: "husband", maz: "husband", męża: "husband", meza: "husband",
  father: "father", ojciec: "father", tata: "father", tato: "father", taty: "father",
  brother: "brother", brat: "brother", brata: "brother",
  grandfather: "grandfather", dziadek: "grandfather", dziadka: "grandfather",
  // feminine
  daughter: "daughter", córka: "daughter", corka: "daughter", córki: "daughter", corki: "daughter",
  wife: "wife", żona: "wife", zona: "wife", żony: "wife", zony: "wife",
  mother: "mother", matka: "mother", mama: "mother", mamy: "mother",
  sister: "sister", siostra: "sister", siostry: "sister",
  grandmother: "grandmother", babcia: "grandmother", babci: "grandmother",
};

const MASCULINE_ROLES = new Set([
  "son", "husband", "father", "brother", "grandfather",
]);
const FEMININE_ROLES = new Set([
  "daughter", "wife", "mother", "sister", "grandmother",
]);

/** Map a PL/EN role word (or entityType) onto a canonical English entityType. */
export function normalizeEntityType(role: string | undefined | null): string {
  const key = (role ?? "").trim().toLowerCase();
  if (!key) return "family";
  return ROLE_ALIASES[key] ?? key;
}

/** Grammatical gender implied by a canonical entityType. */
export function genderForEntityType(entityType: string): FamilyGender {
  const t = normalizeEntityType(entityType);
  if (MASCULINE_ROLES.has(t)) return "masculine";
  if (FEMININE_ROLES.has(t)) return "feminine";
  return "unknown";
}

// ─── Name folding (strip Polish case endings to a comparable stem) ────────────

// Vowels that commonly mark Polish case endings on personal names.
const TRAILING_VOWELS = new Set(["a", "ą", "e", "ę", "i", "y", "o", "u"]);

// Multi-character case suffixes (longest first) for masculine/feminine names:
// e.g. Kevin-owi, Kevin-em, Kasi-ami, Adam-ie.
const MULTI_SUFFIXES = ["owie", "ami", "ach", "owi", "om", "em", "ie"];

const MIN_STEM_LENGTH = 2;

/**
 * Reduce a name to a grouping stem by removing one inflectional suffix and any
 * trailing vowels. All grammatical variants of the same person fold to the same
 * stem: Kevin/Kevina/Kevinowi/Kevinem -> "kevin", Ela/Eli/Elę/Elą -> "el".
 */
export function familyNameStem(name: string): string {
  let s = (name ?? "")
    .toLowerCase()
    .normalize("NFC")
    .replace(/[^a-ząćęłńóśźż]/g, "");
  if (!s) return "";

  for (const suffix of MULTI_SUFFIXES) {
    if (s.length - suffix.length >= MIN_STEM_LENGTH && s.endsWith(suffix)) {
      s = s.slice(0, -suffix.length);
      break;
    }
  }

  // Strip trailing vowels greedily so "kasia"/"kasi" both reach "kas".
  while (s.length > MIN_STEM_LENGTH && TRAILING_VOWELS.has(s[s.length - 1])) {
    s = s.slice(0, -1);
  }

  return s;
}

function capitalize(name: string): string {
  const n = (name ?? "").trim();
  if (!n) return n;
  return n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
}

function endsInConsonant(name: string): boolean {
  const last = name.toLowerCase().slice(-1);
  return /[a-ząćęłńóśźż]/.test(last) && !TRAILING_VOWELS.has(last);
}

/**
 * Choose the canonical (nominative) name for a person from the surface forms
 * we've seen, given the entity's grammatical gender.
 * - masculine: prefer a form ending in a consonant ("Kevin").
 * - feminine:  prefer a form ending in "a" ("Ela", "Kasia").
 * Falls back to stem-based reconstruction when no alias looks nominative.
 */
export function pickCanonicalName(
  aliases: string[],
  gender: FamilyGender
): string {
  const cleaned = aliases.map((a) => a.trim()).filter(Boolean);
  if (cleaned.length === 0) return "";

  if (gender === "masculine") {
    const nominative = cleaned.find(endsInConsonant);
    if (nominative) return capitalize(nominative);
    // Reconstruct: bare stem.
    return capitalize(familyNameStem(cleaned[0]));
  }

  if (gender === "feminine") {
    const nominative = cleaned.find((a) => a.toLowerCase().endsWith("a"));
    if (nominative) return capitalize(nominative);
    // Reconstruct: stem + "a".
    const stem = familyNameStem(cleaned[0]);
    return capitalize(stem) + "a";
  }

  // Unknown gender — keep the first-seen surface form; don't guess an ending.
  return capitalize(cleaned[0]);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export type FamilyEntityInput = {
  name: string;
  entityType?: string | null;
};

/**
 * Normalize a single (name, role) pair into a canonical entity. Use this at
 * extraction time so the stored memory already references the canonical name.
 */
export function normalizeFamilyEntity(
  name: string,
  entityType?: string | null
): CanonicalFamilyEntity {
  const type = normalizeEntityType(entityType);
  const gender = genderForEntityType(type);
  const alias = (name ?? "").trim();
  return {
    entityType: type,
    canonicalName: pickCanonicalName([alias], gender),
    aliases: alias ? [capitalize(alias)] : [],
  };
}

/**
 * Convenience: return just the canonical name for a single (name, role) pair.
 * "Kevina" + "son" -> "Kevin"; "Eli" + "daughter" -> "Ela".
 */
export function normalizeFamilyName(
  name: string,
  entityType?: string | null
): string {
  return normalizeFamilyEntity(name, entityType).canonicalName;
}

/** Stable grouping key — two inputs collapse iff same role-group and stem. */
function entityKey(name: string, entityType: string): string {
  return `${normalizeEntityType(entityType)}:${familyNameStem(name)}`;
}

/** True when two (name, role) pairs are grammatical variants of one person. */
export function isSameFamilyEntity(
  a: FamilyEntityInput,
  b: FamilyEntityInput
): boolean {
  if (!a.name || !b.name) return false;
  return (
    entityKey(a.name, a.entityType ?? "") ===
    entityKey(b.name, b.entityType ?? "")
  );
}

/**
 * Merge many (name, role) pairs into canonical entities. Grammatical variants
 * of the same person are collapsed; every surface form is preserved as an
 * alias (deduped, first-seen order).
 */
export function mergeFamilyEntities(
  inputs: FamilyEntityInput[]
): CanonicalFamilyEntity[] {
  const groups = new Map<string, { type: string; aliases: string[] }>();

  for (const input of inputs) {
    const name = (input.name ?? "").trim();
    if (!name) continue;
    const type = normalizeEntityType(input.entityType);
    const key = entityKey(name, type);

    const existing = groups.get(key);
    const aliasForm = capitalize(name);
    if (!existing) {
      groups.set(key, { type, aliases: [aliasForm] });
    } else if (!existing.aliases.some((a) => a.toLowerCase() === aliasForm.toLowerCase())) {
      existing.aliases.push(aliasForm);
    }
  }

  return [...groups.values()].map(({ type, aliases }) => ({
    entityType: type,
    canonicalName: pickCanonicalName(aliases, genderForEntityType(type)),
    aliases,
  }));
}
