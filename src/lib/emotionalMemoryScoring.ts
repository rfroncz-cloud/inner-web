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
  
    const strongEmotionWords = [
      "kocham",
      "nienawidzę",
      "boję się",
      "samotny",
      "samotna",
      "stres",
      "panika",
      "smutek",
      "płaczę",
      "zły",
      "wściekły",
      "szczęśliwy",
      "dumny",
      "załamany",
      "depresja",
      "lęk",
      "trauma",
    ];
  
    const goalWords = [
      "cel",
      "chcę zbudować",
      "chcę zrobić",
      "planuję",
      "marzę",
      "projekt",
      "biznes",
      "aplikacja",
      "startup",
      "inner",
    ];
  
    const relationshipWords = [
      "żona",
      "syn",
      "córka",
      "mama",
      "tata",
      "rodzina",
      "przyjaciel",
      "przyjaciółka",
      "pies",
      "kot",
    ];
  
    const identityWords = [
      "mam na imię",
      "nazywam się",
      "jestem",
      "mieszkam",
      "urodziny",
      "urodziłem",
      "urodziłam",
      ];

      const familyWords = [
        "my wife", "my husband", "my partner", "my son", "my daughter",
        "my mother", "my father", "my brother", "my sister", "my family",
        "moja żona", "mój mąż", "mój syn", "moja córka",
        "moja mama", "mój tata", "mój brat", "moja siostra", "moja rodzina",
      ];
      
      const petWords = [
        "my dog", "my cat", "my pet", "my pets",
        "mój pies", "moja suka", "mój kot", "moja kotka", "moje zwierzęta",
      ];
      
      const homeWords = [
        "i live in", "i live at", "my home", "my house", "my apartment",
        "mieszkam w", "mieszkam na", "mój dom", "moje mieszkanie",
      ];
      
      const vehicleWords = [
        "my car", "i drive", "i have a car",
        "mój samochód", "moje auto", "jeżdżę", "mam samochód",
      ];
      
      const birthWords = [
        "i was born", "my birthday", "born in",
        "urodziłem się", "urodziłam się", "moje urodziny",
      ];
      
      const childhoodWords = [
        "i grew up", "where i grew up",
        "wychowałem się", "wychowałam się", "dorastałem", "dorastałam",
      ];

    if (strongEmotionWords.some((word) => text.includes(word))) {
      emotional_weight += 3;
      relationship_impact += 2;
      category = "emotional";
    }
  
    if (goalWords.some((word) => text.includes(word))) {
      emotional_weight += 2;
      relationship_impact += 2;
      category = "goal";
    }
  
    if (relationshipWords.some((word) => text.includes(word))) {
      emotional_weight += 2;
      relationship_impact += 3;
      category = "relationship";
    }
  
    if (identityWords.some((word) => text.includes(word))) {
      emotional_weight += 2;
      relationship_impact += 3;
      category = "identity";
    }
  
    if (message.length > 250) {
      emotional_weight += 1;
    }
    if (familyWords.some((word) => text.includes(word))) {
        emotional_weight += 3;
        relationship_impact += 4;
        category = "family";
      }
      
      if (petWords.some((word) => text.includes(word))) {
        emotional_weight += 3;
        relationship_impact += 3;
        category = "pet";
      }
      
      if (homeWords.some((word) => text.includes(word))) {
        emotional_weight += 2;
        relationship_impact += 4;
        category = "home";
      }
      
      if (vehicleWords.some((word) => text.includes(word))) {
        emotional_weight += 2;
        relationship_impact += 2;
        category = "vehicle";
      }
      
      if (birthWords.some((word) => text.includes(word))) {
        emotional_weight += 3;
        relationship_impact += 4;
        category = "birth";
      }
      
      if (childhoodWords.some((word) => text.includes(word))) {
        emotional_weight += 3;
        relationship_impact += 4;
        category = "childhood";
      }
  
    return {
      emotional_weight: Math.min(emotional_weight, 5),
      relationship_impact: Math.min(relationship_impact, 5),
      category,
    };
  }