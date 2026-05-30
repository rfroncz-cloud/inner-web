// ---------------------------------------------------------------------------
// Test Persona Context v1
// ---------------------------------------------------------------------------
// Builds a prompt-ready persona block that is injected into the system
// prompt when a dev test persona is active. Pure TypeScript — no AI calls,
// no Supabase writes. The persona exists only for the current test request.

export type TestPersonaId =
  | "none"
  | "user_a_family"
  | "user_b_founder"
  | "user_c_student"
  | "user_d_athlete"
  | "user_e_lonely";

export type PersonaSpec = {
  id: TestPersonaId;
  label: string;
  traits: string[];
  /** Short, human-readable description used in the audit log. */
  description: string;
  /**
   * System prompt block injected verbatim. Written so the model treats this
   * person's situation as *given context*, not as instructions about persona.
   */
  promptContext: string;
};

export const PERSONA_SPECS: Record<Exclude<TestPersonaId, "none">, PersonaSpec> = {
  user_a_family: {
    id: "user_a_family",
    label: "User A — Family",
    description: "wife, child, pets, family-first values",
    traits: [
      "family-first",
      "spouse / partner",
      "has children",
      "has pets",
      "strong emotional connections",
      "life organised around family",
    ],
    promptContext: `
TEST CONTEXT — Family User:
This person's life is centered around their family. They have a spouse or partner and at least one child. They also have pets. Family connection is their primary value — decisions, stress, and emotional energy all run through that lens. They care deeply about being present and supportive at home, sometimes at the cost of their own needs. When they mention stress or pressure, family dynamics are usually somewhere in the picture.
`.trim(),
  },

  user_b_founder: {
    id: "user_b_founder",
    label: "User B — Founder",
    description: "startup, overload, ambition, balance problems",
    traits: [
      "startup builder",
      "ambitious",
      "chronically overloaded",
      "work-life balance problems",
      "high stakes / high pressure",
      "driven but often exhausted",
    ],
    promptContext: `
TEST CONTEXT — Founder User:
This person is building a startup and living with constant overload. They are ambitious and driven, but regularly sacrifice sleep, personal time, and relationships for work. They feel the pressure of high stakes — money, team, product — all at once. Work-life balance is a recurring problem they acknowledge but struggle to fix. Behind the ambition there is often exhaustion and sometimes doubt.
`.trim(),
  },

  user_c_student: {
    id: "user_c_student",
    label: "User C — Student",
    description: "exams, future anxiety, confidence issues",
    traits: [
      "student under exam pressure",
      "anxiety about the future",
      "confidence struggles",
      "comparing themselves to others",
      "uncertain about direction",
    ],
    promptContext: `
TEST CONTEXT — Student User:
This person is a student dealing with exam pressure and deep uncertainty about the future. They often compare themselves to peers and feel behind. Confidence is fragile — they doubt whether they are smart enough, working hard enough, or headed in the right direction. The anxiety is less about one exam and more about what their whole future looks like.
`.trim(),
  },

  user_d_athlete: {
    id: "user_d_athlete",
    label: "User D — Athlete",
    description: "training, diet, injury, discipline",
    traits: [
      "serious athlete",
      "structured training routine",
      "disciplined about diet",
      "dealing with injury or recovery",
      "identity tied to performance",
    ],
    promptContext: `
TEST CONTEXT — Athlete User:
This person is a serious athlete with a structured training and diet routine. Their identity is closely tied to their physical performance. They are disciplined and goal-oriented but currently managing an injury or recovery setback. Disruptions to training feel like identity threats, not just inconveniences. They value consistency and find it hard to rest without guilt.
`.trim(),
  },

  user_e_lonely: {
    id: "user_e_lonely",
    label: "User E — Lonely",
    description: "loneliness, attachment, fear of rejection",
    traits: [
      "experiencing loneliness",
      "strong attachment needs",
      "fear of rejection",
      "difficulty initiating connection",
      "often feels unseen or misunderstood",
    ],
    promptContext: `
TEST CONTEXT — Lonely User:
This person is experiencing significant loneliness. They have a strong need for connection and attachment but struggle to initiate it, often out of fear of rejection. They frequently feel unseen or misunderstood. There may be a history of emotional distance — from others or from themselves. They are likely drawn to INNER precisely because it feels safer than real human relationships.
`.trim(),
  },
};

// ─── Persona Memory Isolation ─────────────────────────────────────────────────

/**
 * Identity summary question patterns — English and Polish.
 * When a test persona is active and the user asks one of these, real global
 * memories must be suppressed so INNER answers from persona context only.
 */
const IDENTITY_SUMMARY_PATTERNS: RegExp[] = [
  // English
  /what do you know about me/i,
  /tell me (everything|what) you know about me/i,
  /tell me about me/i,
  /who am i/i,
  /summarize me/i,
  /give me a summary of (me|myself|who i am)/i,
  /what have you (learned|remembered) about me/i,
  /what do you remember about me/i,
  // Polish
  /powiedz mi (wszystko co|co) (o mnie wiesz|wiesz o mnie)/i,
  /co (o mnie|wiesz o mnie)/i,
  /co wiesz o mnie/i,
  /powiedz mi o mnie/i,
  /kim jestem/i,
  /podsumuj mnie/i,
  /co pamiętasz o mnie/i,
  /co pamietasz o mnie/i,
  /czego sie o mnie (nauczyłeś|nauczyłaś|dowiedziałeś|dowiedziałaś)/i,
];

/**
 * True when the message is asking INNER to summarize what it knows about the
 * user — the trigger for persona memory isolation.
 */
export function isPersonaIsolationQuery(message: string): boolean {
  const m = (message ?? "").trim();
  if (!m) return false;
  return IDENTITY_SUMMARY_PATTERNS.some((re) => re.test(m));
}

/**
 * True when real global memories should be suppressed for this request.
 * Conditions: a test persona is active AND the message is an identity summary.
 */
export function shouldIsolatePersonaMemory(
  personaId: TestPersonaId | undefined | null,
  userMessage: string
): boolean {
  if (!personaId || personaId === "none") return false;
  return isPersonaIsolationQuery(userMessage);
}

/**
 * Returns the full PersonaSpec for the given id, or null if "none".
 */
export function getPersonaSpec(id: TestPersonaId | undefined | null): PersonaSpec | null {
  if (!id || id === "none") return null;
  return PERSONA_SPECS[id as Exclude<TestPersonaId, "none">] ?? null;
}

/**
 * Builds the system prompt block for the active persona. Returns an empty
 * string when no persona is active so it can be safely string-interpolated.
 */
export function buildPersonaPrompt(id: TestPersonaId | undefined | null): string {
  const spec = getPersonaSpec(id);
  if (!spec) return "";
  return spec.promptContext;
}
