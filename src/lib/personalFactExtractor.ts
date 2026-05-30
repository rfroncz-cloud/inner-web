import { normalizeFamilyName } from "@/lib/familyEntityNormalization";

export type ExtractedFact = {
  memory: string;
  category: string;
};

function cleanValue(value: string) {
  return value.replace(/[.,!?]+$/g, "").trim();
}

function addFact(facts: ExtractedFact[], memory: string, category: string) {
  const normalized = memory.toLowerCase();

  if (!facts.some((fact) => fact.memory.toLowerCase() === normalized)) {
    facts.push({ memory, category });
  }
}

export function extractPersonalFacts(text: string): ExtractedFact[] {
  const facts: ExtractedFact[] = [];
  const lower = text.toLowerCase();

  const nameChars = "a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ";
  const placeChars = "a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\\s-";

  const patterns = [
    {
      category: "identity",
      regexes: [
        new RegExp(`my name is ([${nameChars}]+)`, "i"),
        new RegExp(`mam na imię ([${nameChars}]+)`, "i"),
        new RegExp(`mam na imie ([${nameChars}]+)`, "i"),
        new RegExp(`nazywam się ([${nameChars}]+)`, "i"),
        new RegExp(`nazywam sie ([${nameChars}]+)`, "i"),
      ],
      format: (v: string) => `User's name is ${v}.`,
    },
    {
      category: "family",
      regexes: [
        new RegExp(`my wife is ([${nameChars}]+)`, "i"),
        new RegExp(`my wife's name is ([${nameChars}]+)`, "i"),
        new RegExp(`moja żona ma na imię ([${nameChars}]+)`, "i"),
        new RegExp(`moja zona ma na imie ([${nameChars}]+)`, "i"),
      ],
      format: (v: string) => `User's wife is ${normalizeFamilyName(v, "wife")}.`,
    },
    {
      category: "family",
      regexes: [
        new RegExp(`my husband is ([${nameChars}]+)`, "i"),
        new RegExp(`my husband's name is ([${nameChars}]+)`, "i"),
        new RegExp(`mój mąż ma na imię ([${nameChars}]+)`, "i"),
        new RegExp(`moj maz ma na imie ([${nameChars}]+)`, "i"),
      ],
      format: (v: string) => `User's husband is ${normalizeFamilyName(v, "husband")}.`,
    },
    {
      category: "family",
      regexes: [
        new RegExp(`my son is ([${nameChars}]+)`, "i"),
        new RegExp(`my son's name is ([${nameChars}]+)`, "i"),
        new RegExp(`my son is named ([${nameChars}]+)`, "i"),
        new RegExp(`mój syn ma na imię ([${nameChars}]+)`, "i"),
        new RegExp(`moj syn ma na imie ([${nameChars}]+)`, "i"),
      ],
      format: (v: string) => `User's son is ${normalizeFamilyName(v, "son")}.`,
    },
    {
      category: "family",
      regexes: [
        new RegExp(`my daughter is ([${nameChars}]+)`, "i"),
        new RegExp(`my daughter's name is ([${nameChars}]+)`, "i"),
        new RegExp(`my daughter is named ([${nameChars}]+)`, "i"),
        new RegExp(`moja córka ma na imię ([${nameChars}]+)`, "i"),
        new RegExp(`moja corka ma na imie ([${nameChars}]+)`, "i"),
      ],
      format: (v: string) => `User's daughter is ${normalizeFamilyName(v, "daughter")}.`,
    },
    {
      category: "pet",
      regexes: [
        new RegExp(`my dog is ([${nameChars}]+)`, "i"),
        new RegExp(`my dog's name is ([${nameChars}]+)`, "i"),
        new RegExp(`my dog is named ([${nameChars}]+)`, "i"),
        new RegExp(`mój pies ma na imię ([${nameChars}]+)`, "i"),
        new RegExp(`moj pies ma na imie ([${nameChars}]+)`, "i"),
      ],
      format: (v: string) => `User's dog is ${v}.`,
    },
    {
      category: "pet",
      regexes: [
        new RegExp(`my cat is ([${nameChars}]+)`, "i"),
        new RegExp(`my cat's name is ([${nameChars}]+)`, "i"),
        new RegExp(`my cat is named ([${nameChars}]+)`, "i"),
        new RegExp(`mój kot ma na imię ([${nameChars}]+)`, "i"),
        new RegExp(`moj kot ma na imie ([${nameChars}]+)`, "i"),
      ],
      format: (v: string) => `User's cat is ${v}.`,
    },
    {
      category: "home",
      regexes: [
        new RegExp(`i live in ([${placeChars}]+)`, "i"),
        new RegExp(`mieszkam w ([${placeChars}]+)`, "i"),
      ],
      format: (v: string) => `User lives in ${v}.`,
    },
    {
      category: "birth",
      regexes: [
        /my birthday is ([a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s-]+)/i,
        /urodziny mam ([a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s-]+)/i,
      ],
      format: (v: string) => `User's birthday is ${v}.`,
    },
    {
      category: "birth",
      regexes: [
        new RegExp(`i was born in ([${placeChars}]+)`, "i"),
        new RegExp(`urodziłem się w ([${placeChars}]+)`, "i"),
        new RegExp(`urodzilem sie w ([${placeChars}]+)`, "i"),
      ],
      format: (v: string) => `User was born in ${v}.`,
    },
  ];

  for (const pattern of patterns) {
    for (const regex of pattern.regexes) {
      const match = text.match(regex);

      if (match?.[1]) {
        addFact(facts, pattern.format(cleanValue(match[1])), pattern.category);
      }
    }
  }

  const catsCount = text.match(/i have (\d+) cats/i) || text.match(/mam (\d+) kot/i);

  if (catsCount?.[1]) {
    addFact(facts, `User has ${catsCount[1]} cats.`, "pet");
  }

  if (lower.includes("i work as")) {
    addFact(facts, text.replace(/^I\b/i, "User"), "work");
  }

  if (lower.includes("my hobby")) {
    addFact(facts, text.replace(/^My\b/i, "User's"), "hobby");
  }

  return facts;
}