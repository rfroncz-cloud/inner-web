export type EmotionalScoreResult = {
  emotional_weight: number;
  relationship_impact: number;
  category: string;
};

export function scoreEmotionalMemory(message: string): EmotionalScoreResult {
  const text = message.toLowerCase();

  let emotional_weight = 1;
  let relationship_impact = 1;
  let category = "other";

  const categories = [
    { category: "boundaries", weight: 5, impact: 5, words: ["i don't like", "don't do that", "stop saying", "nie lubię gdy", "nie rób tego", "przestań mówić"] },
    { category: "life_event", weight: 5, impact: 5, words: ["my divorce", "my breakup", "my wedding", "my child was born", "important event", "rozwód", "rozstanie", "ślub", "urodziło mi się dziecko", "ważne wydarzenie"] },
    { category: "identity", weight: 4, impact: 5, words: ["my name is", "my name's", "call me", "mam na imię", "mam na imie", "nazywam się", "nazywam sie"] },
    { category: "family", weight: 4, impact: 5, words: ["my wife", "my husband", "my partner", "my son", "my daughter", "my mother", "my father", "my brother", "my sister", "my family", "moja żona", "mój mąż", "mój syn", "moja córka", "moja mama", "mój tata", "mój brat", "moja siostra", "moja rodzina"] },
    { category: "birth", weight: 4, impact: 5, words: ["i was born", "my birthday", "born in", "urodziłem się", "urodziłam się", "moje urodziny", "miejsce urodzenia"] },
    { category: "childhood", weight: 4, impact: 5, words: ["i grew up", "where i grew up", "wychowałem się", "wychowałam się", "dorastałem", "dorastałam"] },
    { category: "pet", weight: 4, impact: 4, words: ["my dog", "my cat", "my pet", "my pets", "mój pies", "moja suka", "mój kot", "moja kotka", "moje zwierzęta"] },
    { category: "home", weight: 3, impact: 5, words: ["i live in", "i live at", "my home", "my house", "my apartment", "mieszkam w", "mieszkam na", "mój dom", "moje mieszkanie"] },
    { category: "communication", weight: 4, impact: 5, words: ["talk to me", "speak to me", "be direct", "be honest", "short answers", "mów do mnie", "bądź bezpośredni", "bądź szczery", "krótkie odpowiedzi"] },
    { category: "values", weight: 4, impact: 4, words: ["my values", "what matters to me", "family is important", "freedom", "loyalty", "honesty", "moje wartości", "ważna jest dla mnie", "rodzina jest ważna", "wolność", "lojalność", "uczciwość"] },
    { category: "fear", weight: 5, impact: 4, words: ["i am afraid", "i fear", "i worry", "anxiety", "stress", "panic", "boję się", "martwię się", "lęk", "stres", "panika"] },
    { category: "work", weight: 3, impact: 3, words: ["my work", "my job", "my company", "my business", "i work as", "moja praca", "moja firma", "prowadzę firmę", "pracuję jako"] },
    { category: "finance", weight: 3, impact: 3, words: ["money", "financial", "income", "debt", "investment", "budget", "pieniądze", "finanse", "dochód", "inwestycja", "budżet"] },
    { category: "health", weight: 3, impact: 3, words: ["my health", "i feel tired", "sleep", "energy", "gym", "workout", "zdrowie", "sen", "energia", "siłownia", "trening"] },
    { category: "goal", weight: 3, impact: 3, words: ["my goal", "i want to build", "i am building", "cel", "chcę zbudować", "chcę zrobić", "planuję", "marzę", "projekt", "startup", "inner"] },
    { category: "hobby", weight: 2, impact: 2, words: ["my hobby", "my hobbies", "i enjoy", "i like", "i love doing", "moje hobby", "interesuję się", "lubię"] },
    { category: "routine", weight: 2, impact: 2, words: ["every day", "my routine", "usually", "always", "daily", "codziennie", "moja rutyna", "zazwyczaj", "zawsze"] },
    { category: "education", weight: 2, impact: 2, words: ["i study", "learning", "course", "university", "school", "uczę się", "kurs", "szkoła", "studia"] },
    { category: "preference", weight: 2, impact: 2, words: ["i like", "i dislike", "i prefer", "favorite", "nie lubię", "wolę", "ulubiony"] },
    { category: "emotional", weight: 3, impact: 2, words: ["kocham", "nienawidzę", "samotny", "samotna", "smutek", "płaczę", "zły", "wściekły", "szczęśliwy", "dumny", "załamany", "depresja", "trauma"] },
    { category: "vehicle", weight: 2, impact: 2, words: ["my car", "i drive", "i have a car", "mój samochód", "moje auto", "jeżdżę", "mam samochód"] },
  ];

  const match = categories.find((item) =>
    item.words.some((word) => text.includes(word))
  );

  if (match) {
    category = match.category;
    emotional_weight = match.weight;
    relationship_impact = match.impact;
  }

  if (message.length > 250) {
    emotional_weight += 1;
  }

  return {
    emotional_weight: Math.min(emotional_weight, 5),
    relationship_impact: Math.min(relationship_impact, 5),
    category,
  };
}