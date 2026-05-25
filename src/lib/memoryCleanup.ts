import { shouldDecayMemory } from "@/lib/memoryDecay";
export type MemoryLike = {
  memory?: string;
  type?: string;
  category?: string;
  importance?: number;
};

const protectedTypes = ["core_fact"];

const protectedCategories = [
  "identity",
  "family",
  "pet",
  "home",
  "birth",
  "childhood",
  "vehicle",
  "work",
  "health",
  "finance",
  "values",
];

const trashPatterns = [
  "http://",
  "https://",
  "localhost:",
  "deep analysis on this",
  "go deeper on this",
  "analyze this",
  "test",
  "xd",
  "lol",
  "haha",
  "jaka dziś jest data",
  "jaka dzis jest data",
  "która godzina",
  "ktora godzina",
  "what time is it",
  "what is today",
  "what date is it",
  "siema",
  "cześć",
  "czesc",
  "hello",
  "hej",
  "ok",
  "okej",
];

const questionPatterns = [
  "?",
  "jak mam na imię",
  "jak mam na imie",
  "what is my name",
  "who is my wife",
  "what is my wife",
  "what is my son's name",
  "what is my dog's name",
  "where do i live",
];

export function shouldDeleteMemory(memory: MemoryLike): boolean {
  const text = (memory.memory || "").toLowerCase().trim();
  const category = memory.category || "";
  const type = memory.type || "";
  const importance = memory.importance || 0;

  if (!text) return true;

  if (protectedTypes.includes(type)) return false;
  if (protectedCategories.includes(category)) return false;
  if (importance >= 80) return false;

  if (text.length < 8) return true;
  if (text.length > 600) return true;

  if (trashPatterns.some((pattern) => text.includes(pattern))) {
    return true;
  }

  if (questionPatterns.some((pattern) => text.includes(pattern))) {
    return true;
  }

  if (
    text.includes("function ") ||
    text.includes("const ") ||
    text.includes("import ") ||
    text.includes("export ") ||
    text.includes("=>") ||
    text.includes("error:") ||
    text.includes("syntaxerror")
  ) {
    return true;
  }
  if (shouldDecayMemory(memory)) {
    return true;
  }
  return false;
}