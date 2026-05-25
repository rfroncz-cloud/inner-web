export type ExtractedFact = {
    memory: string;
    category: string;
  };
  
  function cleanValue(value: string) {
    return value
      .replace(/[.,!?]+$/g, "")
      .trim();
  }
  
  function addFact(
    facts: ExtractedFact[],
    memory: string,
    category: string
  ) {
    const normalized = memory.toLowerCase();
  
    const exists = facts.some(
      (fact) => fact.memory.toLowerCase() === normalized
    );
  
    if (!exists) {
      facts.push({ memory, category });
    }
  }
  
  export function extractPersonalFacts(text: string): ExtractedFact[] {
    const facts: ExtractedFact[] = [];
    const lower = text.toLowerCase();
  
    const patterns = [
      {
        category: "identity",
        regexes: [
          /my name is ([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)/i,
          /mam na imię ([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)/i,
          /nazywam się ([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)/i,
        ],
        format: (v: string) => `User's name is ${v}.`,
      },
      {
        category: "family",
        regexes: [
            /my wife is ([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)/i,
            /my wife's name is ([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)/i,
            /moja żona ma na imię ([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)/i,
          ],
        format: (v: string) => `User's wife is ${v}.`,
      },
      {
        category: "family",
        regexes: [
          /my husband is ([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)/i,
          /mój mąż ma na imię ([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)/i,
        ],
        format: (v: string) => `User's husband is ${v}.`,
      },
      {
        category: "family",
        regexes: [
          /my son is ([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)/i,
          /my son is named ([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)/i,
          /mój syn ma na imię ([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)/i,
          /moj syn ma na imie ([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)/i,
        ],
        format: (v: string) => `User's son is ${v}.`,
      },
      {
        category: "family",
        regexes: [
          /my daughter is ([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)/i,
          /my daughter is named ([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)/i,
          /moja córka ma na imię ([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)/i,
          /moja corka ma na imie ([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)/i,
        ],
        format: (v: string) => `User's daughter is ${v}.`,
      },
      {
        category: "pet",
        regexes: [
          /my dog is ([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)/i,
          /my dog is named ([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)/i,
          /mój pies ma na imię ([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)/i,
          /moj pies ma na imie ([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)/i,
        ],
        format: (v: string) => `User's dog is ${v}.`,
      },
      {
        category: "pet",
        regexes: [
          /my cat is ([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)/i,
          /my cat is named ([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)/i,
          /mój kot ma na imię ([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)/i,
          /moj kot ma na imie ([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)/i,
        ],
        format: (v: string) => `User's cat is ${v}.`,
      },
      {
        category: "home",
        regexes: [
          /i live in ([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s-]+)/i,
          /mieszkam w ([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s-]+)/i,
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
          /i was born in ([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s-]+)/i,
          /urodziłem się w ([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s-]+)/i,
          /urodzilem sie w ([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s-]+)/i,
        ],
        format: (v: string) => `User was born in ${v}.`,
      },
    ];
  
    for (const pattern of patterns) {
      for (const regex of pattern.regexes) {
        const match = text.match(regex);
  
        if (match?.[1]) {
          addFact(
            facts,
            pattern.format(cleanValue(match[1])),
            pattern.category
          );
        }
      }
    }
  
    const catsCount =
      text.match(/i have (\d+) cats/i) ||
      text.match(/mam (\d+) kot/i);
  
    if (catsCount?.[1]) {
      addFact(facts, `User has ${catsCount[1]} cats.`, "pet");
    }
  
    if (lower.includes("i work as")) {
      addFact(facts, text, "work");
    }
  
    if (lower.includes("my hobby") || lower.includes("i love")) {
      addFact(facts, text, "hobby");
    }
  
    return facts;
  }