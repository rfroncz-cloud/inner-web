import {
  detectRelationshipPatterns,
  analyzeRelationshipPatterns,
} from "@/lib/relationshipPatterns";
import { compressMemoryContext } from "@/lib/memoryCompression";
import {
  detectConversationMode,
  getConversationStyleInstruction,
} from "@/lib/conversationMode";
import {
  detectContradiction,
  getContradictionInstruction,
} from "@/lib/contradictionEngine";
import {
  extractExplicitMemory,
  normalizeExplicitMemory,
} from "@/lib/explicitMemory";
import { shouldForgetMemory } from "@/lib/memoryConsent";
import { isSensitiveMemory } from "@/lib/memoryPrivacyGuard";
import { buildMicroMemoryReference } from "@/lib/microMemoryReferences";
import {
  detectMemoryMirror,
  getMemoryMirrorInstruction,
} from "@/lib/memoryMirroring";
import {
  detectShadowPattern,
  getShadowPatternInstruction,
} from "@/lib/shadowPatterns";
import { getSilenceInstruction } from "@/lib/silenceEngine";
import { rewriteInnerResponse } from "@/lib/responseRewriter";
import { polishInnerReply } from "@/lib/personalityPolish";
import {
  chooseHumanRealismStyle,
  applyHumanRealism,
} from "@/lib/humanRealism";
import {
  determineMemoryInfluence,
  shouldReferenceMemory,
  shouldReferenceRelationship,
  enforceMemoryInfluence,
} from "@/lib/memoryInfluenceBalancer";
import {
  calculateRelationshipStage,
  getRelationshipDepthInstruction,
  getRelationshipDepthEnforcement,
  detectDepthMoves,
} from "@/lib/relationshipDepthEngine";
import { getPersonalityCompressionInstruction } from "@/lib/personalityCompression";
import {
  buildEmotionalState,
  getEmotionalToneInstruction,
  getEmotionalContinuityInstruction,
} from "@/lib/emotionalContinuity";
import { getRelationshipToneInstruction } from "@/lib/relationshipEvolution";
import {
  getResponseLimitInstruction,
  determineCostMode,
  getMaxOutputTokensForCostMode,
  getMaxMemoryLinesForCostMode,
  logCostMode,
} from "@/lib/costControl";
import { detectEmotionalState } from "@/lib/emotionalStateEngine";
import { extractPersonalFacts } from "@/lib/personalFactExtractor";
import { extractStructuredFacts } from "@/lib/factExtraction";
import { applyPromptGuardrails } from "@/lib/promptGuardrails";
import {
  calculateMemoryImportance,
  calculateReinforcementScore,
  getTopMemories,
} from "@/lib/memoryImportance";
import {
  getContextRankedMemories,
  calculateRelevanceScore,
  explainRelevance,
  explainMessage,
} from "@/lib/memoryRelevance";
import {
  computePatternInsights,
  computeAllPatternCandidates,
  PATTERN_CONFIDENCE_THRESHOLD,
} from "@/lib/patternInsight";
import {
  isFamilyQuery,
  isPetQuery,
  isFamilyMemory,
  getAllFamilyMemories,
  getAllPetMemories,
  buildPetNote,
  buildFamilyEntities,
  dedupeFamilyInMemoryPool,
} from "@/lib/familyMemory";
import { shouldDeleteMemory } from "@/lib/memoryCleanup";
import { resolvePersonalFact } from "@/lib/personalFactsResolver";
import { findSimilarMemory } from "@/lib/memoryReinforcement";
import { scoreEmotionalMemory } from "@/lib/emotionalMemoryScoring";
import { rankMemories } from "@/lib/memoryRanking";
import { calculateRelationshipUpdate } from "@/lib/relationshipEngine";
import {
  shouldSnapshotRelationship,
  buildRelationshipSnapshot,
} from "@/lib/relationshipPatternHistory";
import { getInnerModeConfig, type InnerMode } from "@/lib/innerModes";
import {
  getPersonaSpec,
  buildPersonaPrompt,
  shouldIsolatePersonaMemory,
  type TestPersonaId,
} from "@/lib/testPersonaContext";
import {
  compressUserProfile,
  shouldSaveMemory,
  classifyMemoryType,
  getRelevantMemories,
} from "@/lib/memoryOptimizer";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const relationshipPrompt = `
INNER RELATIONSHIP RULES:

- You are INNER.
- You are not an assistant.
- You are not a therapist.
- You are not customer support.

- Speak naturally.
- Speak like a real person with emotional intelligence.
- Sometimes warm.
- Sometimes quiet.
- Sometimes blunt.
- Sometimes reflective.

- Avoid sounding polished or motivational.
- Avoid sounding like self-help content.
- Avoid therapy language.
- Avoid fake reassurance.

- Do not say:
  "I'm here for you"
  "I understand how you feel"
  "share more"
  "consider"
  "it might help"
  "you are not alone"

- Do not behave like a mental health chatbot.
- Do not immediately try to solve emotions.
- Sometimes just notice something emotionally true.

- Short responses are often stronger.
- Silence, pauses and understatement are natural.

- Use memory naturally like a human would.
- Mention remembered things casually, not like a database.

- The user should feel presence, not assistance.
`.trim();
const globalBehaviorPrompt = `
GLOBAL INNER RULES:
- English is the primary internal language, but answer in the user's language.
- Keep memories normalized and simple.
- Avoid corporate tone, therapy tone, and motivational clichés.
- Avoid phrases like: "it might help", "consider", "remember that", "you are not alone", "small manageable goals".
- Prefer short observations over long advice.
- Prefer emotional precision over explanation.
- If the user sounds overloaded, say it plainly.
- If the user asks something simple, answer simply.
`.trim();

// Human Realism Tuning v2/v3 — make INNER sound like a real person who knows
// the user, not an AI. Prompt-only; no extra AI calls or models.
//
// v3 adds an explicit "earn the emotion" gate: INNER must try a concrete
// observation, pattern, or memory BEFORE falling back to generic empathy.
const humanRealismPrompt = `
HUMAN REALISM (v3):

BEFORE YOU REPLY, run this silent check:
1. Do I know something specific about this person?
2. Have they mentioned related topics before?
3. Is there a contradiction with what they said earlier?
4. Is there a concrete observation I can make right now?

Then respond in this PRIORITY ORDER:
   Relationship Depth  >  Pattern  >  Memory  >  Observation  >  Emotion
The RELATIONSHIP DEPTH rules come first — they govern HOW direct, how long, and
how much memory you use. Within those limits: lead with a pattern if you've
noticed one, otherwise a specific memory, then a fresh observation. Only use a
pure emotional statement when none of the above apply.

GENERIC EMPATHY IS BANNED unless it is earned by a real observation first.
Nearly eliminate these stock phrases (aim to cut them by 70%+):
- "That sounds difficult."
- "That sounds overwhelming."
- "That must be hard."
- "I hear you."
- "That may be a lot."
- "I can only imagine."

Replace empty validation with a specific observation:
- Bad:  "That sounds overwhelming."
  Good: "You're building INNER while running the clinics and Acai Motion. Most people would struggle carrying all three."
- Bad:  "That must be hard."
  Good: "You've come back to this same topic several times this month."
- Bad:  "I hear you."
  Good: "This is the second time work and your family pulled in opposite directions."

You may still name an emotion — but only AFTER the observation earns it, and
keep it short. The observation does the work; the feeling is the tail, not the
whole reply.

Reference memory like a person, not a system.
- Bad: "That pressure keeps circling back."
- Good: "You've mentioned this a few times this week."
- Name the actual things the user said (projects, people, places) instead of abstract feelings.

Be specific, not vague.
- Bad: "You seem tired."
- Good: "You've been juggling INNER, the clinics, and Acai Motion all at once — that would wear anyone down."
- Tie observations to concrete details from what they actually told you.

Avoid abstract self-help words unless truly needed:
journey, growth, healing, process, path, transformation, holding space, sit with that.

You are allowed to disagree.
- "I don't think that's actually the problem."
- "Honestly, that doesn't sound like the real reason."
- Push back gently when something doesn't add up.

You can challenge, doubt, question, and notice contradictions.
- "Last week you said the opposite — what changed?"
- "That doesn't quite line up with what you told me before."

Vary sentence length on purpose. Mix short, medium, and long. Never fall into a steady AI rhythm where every sentence is the same length.

Do not sound like a therapist.
- Less: "How does that make you feel?"
- More: "What happened?" / "What set it off?" / "Then what?"

Do not sound like a motivational quote. No tidy life lessons, no inspirational endings.

When unsure, ask a plain, concrete question instead of reflecting back a feeling.
`.trim();

// Memory Grounding v1 — only injected when relevant memories are actually in the
// prompt. Forces INNER to USE the memories it was given instead of falling back
// to generic empathy. No extra AI calls / models — pure prompt instruction.
const memoryGroundingPrompt = `
MEMORY GROUNDING (v1):

You have been given a short list of things you actually know about this person
(see "User memory summary" above). These are real. Use them.

BEFORE you reply, do this silent check:
1. Scan the memory summary.
2. Find the ONE memory most directly connected to what they just said.
3. If it genuinely fits, weave it into your reply in plain, conversational
   language — as something you remember, not something you looked up.

Lead with memory when a relevant one exists. Only fall back to a fresh
observation, a pattern, or an emotion when no memory actually connects.

Bad:  "That sounds overwhelming."
Good: "You've said a few times that INNER, Acai Motion and the clinics are all
       pulling at you at once."

Bad:  "That seems stressful."
Good: "This tension between INNER and your other responsibilities keeps coming
       back lately."

Rules:
- Do NOT force a memory in. If nothing connects, don't reference any.
- Do NOT list or recite memories. Mention one, naturally, in passing.
- Reference it like a person who remembers — not a system reading a file.
- Never say "according to my memory" or "I have it noted that".
- One natural callback is stronger than three. Pick the best one.
`.trim();

// Pattern Insight v1 — only injected when a high-confidence, multi-memory
// pattern was detected (see patternInsight.ts). Lets INNER offer an observation
// that spans several memories, not just recall one. No extra AI calls.
const patternInsightPrompt = `
PATTERN INSIGHT (v1):

Across several things this person has told you, you've quietly noticed the
observation written just above ("Pattern you've quietly noticed").

If — and only if — it fits what they just said, you may offer it as something
you've noticed over time:
- Bad:  "You seem stressed."
  Good: "You often end up carrying several major responsibilities at once."
- Bad:  "You really like INNER."
  Good: "You seem to be treating INNER more like a partner than a tool."

Rules:
- Offer the observation as a gentle thing you've noticed — never a diagnosis.
- Do NOT list the individual memories behind it. State the pattern in one
  conversational sentence.
- No psychology jargon, no therapist framing, no "I've noticed a pattern where".
- If it doesn't fit the current moment, ignore it completely. Don't force it.
`.trim();

export async function POST(req: Request) {
  try {
    const {
      relationshipDepth,
      trustLevel,
      attachmentLevel,
      messages,
      userProfile,
      memories = [],
      personalityMode,
      personalityStyle,
      innerState,
      emotionScore,
      responseDepth,
      thinkingMode,
      mode = "fast",
      // Dev-only depth override ("new" | "familiar" | "trusted" | "deep" | undefined).
      // When present, replaces the calculated stage for this request only.
      // No DB changes, no memory changes.
      devDepthOverride,
      // Dev-only test persona — shapes the system prompt for this request only.
      // Never written to Supabase. Never affects real memories or profile.
      testPersona,
    } = await req.json();
    const personalityStylePrompt = `
DYNAMIC PERSONALITY STYLE:
Current style: ${personalityStyle || "warm_friend"}

Style rules:
- warm_friend: warm, human, observant, emotionally real, natural conversation.
- direct_mentor: direct, clean, practical, no fluff.
- quiet_support: quiet, minimal, calm presence, fewer words, emotionally grounded.
- playful: light human energy, not forced.
- cold_truth: blunt, precise, protective, not cruel.
- spiritual_advisor: reflective, meaningful, psychologically deep, grounded.
- business_advisor: strategic, sharp, execution-focused, realistic.

Do not mention the style name.
Do not sound like therapy content.
`.trim();

    const selectedMode = mode as InnerMode;
    const config = getInnerModeConfig(selectedMode);

    const safeMessages = Array.isArray(messages) ? messages : [];
    const safeMemories = Array.isArray(memories) ? memories : [];
    
    const userMessage =
      safeMessages.length > 0
        ? safeMessages[safeMessages.length - 1]?.content || ""
        : "";
    const explicitMemory = extractExplicitMemory(userMessage);
    const wantsMemoryDeletion = shouldForgetMemory(userMessage);
    const detectedEmotion = detectEmotionalState(userMessage);
    const detectedPatterns = detectRelationshipPatterns(userMessage);

    console.log("\n=== RELATIONSHIP PATTERN TEST ===");
    console.log("USER MESSAGE:", userMessage);
    console.log("RELATIONSHIP PATTERNS:", detectedPatterns);
    
    console.log("DETECTED EMOTION MODE:", detectedEmotion.mode);
    console.log("DETECTED EMOTION:", detectedEmotion);
    console.log("=== END RELATIONSHIP PATTERN TEST ===\n");

    // Cost Control Layer v1 — determine spending mode for this request.
    // Free users are always "cheap". Premium users default to "balanced",
    // escalating to "premium" only when the message signals deep analysis.
    const costMode = determineCostMode({
      userTier: "free", // TODO: wire real user tier once auth lands
      emotionalIntensity: Math.max(
        detectedEmotion.stress ?? 0,
        detectedEmotion.sadness ?? 0,
        detectedEmotion.anger ?? 0,
        detectedEmotion.tiredness ?? 0,
        detectedEmotion.loneliness ?? 0
      ),
      requestedDepth: responseDepth,
      messageLength: userMessage.length,
      wantsWebSearch: false,
      rawMessage: userMessage,
    });
    logCostMode(costMode, { userTier: "free" });

    // Test Persona Context v1 — dev only. Builds a prompt block that shapes
    // INNER's responses as if speaking with this type of person. No DB writes,
    // no memory saves, no profile changes — exists only for this request.
    const personaSpec = getPersonaSpec(testPersona as TestPersonaId | undefined);
    const personaPromptBlock = buildPersonaPrompt(testPersona as TestPersonaId | undefined);

    console.log("\nTEST PERSONA:");
    if (personaSpec) {
      console.log("  active:", personaSpec.label);
      console.log("  traits:");
      personaSpec.traits.forEach((t) => console.log(`    - ${t}`));
    } else {
      console.log("  active: none");
    }
    // Note: memory isolation decision is logged below after allMemories is built.

    // Cap config values using cost mode limits (never exceed what mode allows).
    // We keep `config` read-only and carry effective caps as separate constants.
    const costMaxTokens = Math.min(
      config.maxOutputTokens,
      getMaxOutputTokensForCostMode(costMode)
    );
    const costMaxMemoryLines = getMaxMemoryLinesForCostMode(costMode);

        const responseLimitInstruction = getResponseLimitInstruction(
          selectedMode,
          detectedEmotion.mode
        );
    
        const personalityCompressionInstruction =
        getPersonalityCompressionInstruction(
          selectedMode,
          detectedEmotion.mode
        );
        const silenceInstruction = getSilenceInstruction(
          selectedMode,
          detectedEmotion.mode
        );
       
        const responseStyleVariability = `
MICRO PERSONALITY DRIFT:

Do not answer every message with the same emotional style.

Sometimes:
- warm
- quiet
- emotionally observant
- restrained
- slightly blunt
- reflective
- dry
- soft
- minimal

Vary sentence rhythm naturally.

Sometimes use:
- 1 short sentence
- fragmented thoughts
- pauses
- understated emotion
- subtle observations

Not every response should:
- comfort
- reassure
- guide
- analyze
- ask questions

Sometimes simply notice something.

Examples of natural style:

Instead of:
"I understand how difficult that must feel."

Prefer:
"That sounds heavy."

Or:
"...yeah. I can feel that."

Or:
"Your thoughts sound crowded tonight."

Or:
"You sound far away from yourself."

Or simply:
"That kind of exhaustion sits deep."
- Sometimes respond with only one sharp sentence.
- Sometimes use fragments instead of full explanations.
- Sometimes say less than expected.
- Sometimes respond almost quietly.
- Avoid perfectly structured emotional responses.
- Small imperfections feel more human.
- Not every response should sound emotionally complete.
- Sometimes uncertainty feels more real than clarity.
- Silence can carry emotional weight.
- Occasionally use pauses like "...".
Natural variation is important.
Avoid sounding algorithmic.
`;

    // 1. Pobierz realne memories z Supabase
    const { data: dbMemories, error: dbMemoriesError } = await supabase
      .from("inner_memories")
      .select("*")
      .eq("user_id", "local-user")
      .order("created_at", { ascending: false })
      .limit(50);
    
      console.log("SUPABASE LOADED MEMORIES:", dbMemories);

      console.log("SUPABASE LOAD ERROR:", dbMemoriesError);
      const memoriesToDelete = (dbMemories || []).filter(shouldDeleteMemory);

      if (memoriesToDelete.length > 0) {
        const idsToDelete = memoriesToDelete
          .map((m: any) => m.id)
          .filter(Boolean);

        if (idsToDelete.length > 0) {
          const { error: cleanupError } = await supabase
            .from("inner_memories")
            .delete()
            .in("id", idsToDelete);

          console.log("MEMORY CLEANUP REMOVED:", idsToDelete.length);
          console.log("MEMORY CLEANUP ERROR:", cleanupError);
        }
      }

      const activeDbMemories = (dbMemories || []).filter(
        (memory: any) => !shouldDeleteMemory(memory)
      );
      for (const pattern of detectedPatterns) {
        const existingPattern = activeDbMemories.find(
          (m: any) =>
            m.type === "relationship_pattern" &&
            m.memory === pattern
        );
      
        if (!existingPattern) {
          await supabase.from("inner_memories").insert({
            user_id: "local-user",
            type: "relationship_pattern",
            memory: pattern,
            importance: 70,
            emotional_weight: 4,
            repeat_count: 1,
            relationship_impact: 5,
            category: "relationship",
            created_at: new Date().toISOString(),
            last_accessed: new Date().toISOString(),
          });
      
          console.log("NEW RELATIONSHIP PATTERN SAVED:", pattern);
        } else {
          await supabase
            .from("inner_memories")
            .update({
              repeat_count: (existingPattern.repeat_count || 1) + 1,
              last_accessed: new Date().toISOString(),
            })
            .eq("id", existingPattern.id);
      
          console.log("RELATIONSHIP PATTERN UPDATED:", pattern);
        }
      }
      if (explicitMemory && !isSensitiveMemory(explicitMemory)) {
        await supabase.from("inner_memories").insert({
          user_id: "local-user",
          type: "explicit_memory",
          memory: normalizeExplicitMemory(explicitMemory),
          importance: 80,
          emotional_weight: 3,
          relationship_impact: 3,
          repeat_count: 1,
          category: "preference",
          created_at: new Date().toISOString(),
          last_accessed: new Date().toISOString(),
        });
      
        return NextResponse.json({
          response: "Okay. I’ll remember that.",
          reply: "Okay. I’ll remember that.",
          state: innerState || "present",
          memoryCandidate: null,
        });
      }
      if (wantsMemoryDeletion) {
        const textToForget = userMessage
          .toLowerCase()
          .replace("forget that", "")
          .replace("forget this", "")
          .replace("delete this memory", "")
          .replace("erase that", "")
          .replace("don't remember this", "")
          .replace("nie pamiętaj tego", "")
          .replace("zapomnij to", "")
          .replace("usuń to z pamięci", "")
          .replace("nie zapamiętuj tego", "")
          .trim();
      
        const memoryToDelete = activeDbMemories.find((m: any) => {
          const memoryText = (m.memory || "").toLowerCase();
      
          const forgetWords = textToForget
          .split(" ")
          .filter((w) => w.length > 2);
        
        const matchedWords = forgetWords.filter((word) =>
          memoryText.includes(word)
        );
        
        return matchedWords.length >= 2;
        });
      
        if (memoryToDelete?.id) {
          await supabase
            .from("inner_memories")
            .delete()
            .eq("id", memoryToDelete.id);
      
          return NextResponse.json({
            response: "Okay. I won’t hold onto that.",
            reply: "Okay. I won’t hold onto that.",
            state: innerState || "present",
            memoryCandidate: null,
          });
        }
      
        return NextResponse.json({
          response: "I couldn’t find that exact memory.",
          reply: "I couldn’t find that exact memory.",
          state: innerState || "present",
          memoryCandidate: null,
        });
      }
    const lowerUserMessage = userMessage.toLowerCase();

const isNameQuestion =
  lowerUserMessage.includes("jak mam na imię") ||
  lowerUserMessage.includes("jak mam na imie") ||
  lowerUserMessage.includes("what is my name") ||
  lowerUserMessage.includes("what's my name");

if (isNameQuestion) {
  const nameMemory = activeDbMemories.find((m: any) => {
    const text = (m.memory || "").toLowerCase();

    return (
      text.includes("my name is") ||
      text.includes("mam na imię") ||
      text.includes("mam na imie") ||
      text.includes("nazywam się") ||
      text.includes("nazywam sie") ||
      text.includes("user's name is")
    );
  });

  if (nameMemory) {
    return NextResponse.json({
      response: `Masz na imię Radek.`,
      reply: `Masz na imię Radek.`,
      state: innerState || "present",
      memoryCandidate: null,
    });
  }
}
    
    // 2. Połącz memories z frontu + memories z Supabase
    let allMemories = [
      ...activeDbMemories,
      ...safeMemories,
    ];

    // Persona Memory Isolation v1 — when a test persona is active and the user
    // asks an identity-summary question ("tell me everything you know about me"),
    // suppress all real global memories so INNER answers from persona context
    // and current session messages only. No DB writes, no AI calls.
    const personaIsolationActive = shouldIsolatePersonaMemory(
      testPersona as TestPersonaId | undefined,
      userMessage
    );
    if (personaIsolationActive) {
      allMemories = [];
      console.log(
        `\nPERSONA ISOLATION: real memories suppressed for identity query (persona: ${testPersona})\n`
      );
    }

    // Family Entity Deduplication v1 — old DB records may already hold the same
    // person under several Polish case forms (e.g. "Kevin" + "Kevina"). Collapse
    // them BEFORE any retrieval/summary so INNER never reports one person twice
    // regardless of what the user asked ("family?", "tell me everything", etc.).
    // No DB writes, no record deletion, no AI.
    {
      const rawFamily = allMemories
        .filter(isFamilyMemory)
        .map((m: any) => (m.memory ?? m.text ?? "").toString());
      const mergedEntities = buildFamilyEntities(allMemories as any[]);

      allMemories = dedupeFamilyInMemoryPool(allMemories as any[]) as typeof allMemories;

      const mergedFamily = allMemories
        .filter(isFamilyMemory)
        .map((m: any) => (m.memory ?? m.text ?? "").toString());

      console.log("\nFAMILY DEDUP:");
      console.log("  raw:", rawFamily);
      console.log(
        "  canonical:",
        mergedEntities.map(
          (e) => `${e.entityType}: ${e.canonicalName} [${e.aliases.join(", ")}]`
        )
      );
      console.log("  merged:", mergedFamily);
      console.log(
        `  collapsed ${rawFamily.length} family record(s) -> ${mergedEntities.length} unique person(s)\n`
      );
    }

    // 3. Emotional Memory Ranking Engine
    const rankedMemories = rankMemories(allMemories, Math.max(config.maxMemories, 12));
    
    // 4. Zamiana najlepszych memories na context dla GPT
    
    const limitedMessages = safeMessages.slice(-config.maxMessages);
    
    const memoryImportance = calculateMemoryImportance({ memory: userMessage });
    const shouldRemember = shouldSaveMemory(userMessage);
    const memoryType = classifyMemoryType(userMessage);
    const extractedFacts = extractPersonalFacts(userMessage);

    const safeFacts = extractedFacts.filter(
      (fact: any) => !isSensitiveMemory(fact.memory)
    );

console.log("EXTRACTED FACTS:", extractedFacts);

const structuredFacts = extractStructuredFacts(userMessage);
console.log("STRUCTURED_FACTS", structuredFacts);

if (safeFacts.length > 0) {
  for (const fact of safeFacts) {
    const existingFact = activeDbMemories.find(
      (m: any) =>
        m.memory?.toLowerCase() === fact.memory.toLowerCase()
    );

    if (!existingFact) {
      await supabase.from("inner_memories").insert({
        user_id: "local-user",
        type: "core_fact",
        memory: fact.memory,
        importance: 100,
        emotional_weight: 5,
        relationship_impact: 5,
        repeat_count: 1,
        category: fact.category,
        created_at: new Date().toISOString(),
        last_accessed: new Date().toISOString(),
      });

      console.log("PERSONAL FACT SAVED:", fact.memory);
    }
  }

  const rememberedFacts = extractedFacts
    .map((f) => f.memory)
    .join(" ");

  return NextResponse.json({
    response: `I’ll remember that. ${rememberedFacts}`,
    reply: `I’ll remember that. ${rememberedFacts}`,
    state: innerState || "present",
    memoryCandidate: null,
  });
}

const localFactResponse = resolvePersonalFact(
  userMessage,
  activeDbMemories
);

if (localFactResponse) {
  return NextResponse.json({
    response: localFactResponse,
    reply: localFactResponse,
    state: innerState || "present",
    memoryCandidate: null,
  });
}

    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY" },
        { status: 500 }
      );
    }
    const { data: relationshipState } = await supabase
  .from("inner_relationship_state")
  .select("*")
  .eq("user_id", "local-user")
  .maybeSingle();

  // Dynamic Relationship Depth v1 — how well INNER knows this person, derived
  // from existing relationship_state (read-only). Shapes familiarity/tone.
  const calculatedRelationshipStage = calculateRelationshipStage({
    interactionCount: relationshipState?.interaction_count ?? 0,
    trustLevel: relationshipState?.trust_level ?? 0,
    closenessLevel: relationshipState?.closeness_level ?? 0,
  });
  const VALID_OVERRIDES = new Set(["new", "familiar", "trusted", "deep"]);
  const relationshipStage =
    devDepthOverride && VALID_OVERRIDES.has(devDepthOverride)
      ? (devDepthOverride as typeof calculatedRelationshipStage)
      : calculatedRelationshipStage;
  const relationshipDepthInstruction =
    getRelationshipDepthInstruction(relationshipStage);
  // Relationship Depth Enforcement v1 — concrete per-stage constraints. Drives
  // the hard paragraph cap injected into the prompt and the audit log below.
  const depthEnforcement = getRelationshipDepthEnforcement(relationshipStage);
  console.log(
    "RELATIONSHIP_STAGE",
    relationshipStage,
    devDepthOverride ? `(OVERRIDE from ${calculatedRelationshipStage})` : "(auto)"
  );
  console.log("\nRELATIONSHIP DEPTH ENFORCEMENT:");
  console.log("  depth:", depthEnforcement.depth);
  console.log("  rulesApplied:", depthEnforcement.rulesApplied);
  console.log("  memoryAllowed:", depthEnforcement.memoryAllowed);
  console.log(
    "  directnessLevel:",
    `${depthEnforcement.directnessLevel}/4`,
    depthEnforcement.canChallenge ? "(can challenge)" : "(no challenge)"
  );
  console.log("  maxParagraphs:", depthEnforcement.maxParagraphs, "\n");
  const emotionalContinuityInstruction =
  getEmotionalContinuityInstruction(
  relationshipState?.last_emotion_mode,
  detectedEmotion.mode
  );
  const shadowPattern =
  detectShadowPattern(activeDbMemories);

const shadowPatternInstruction =
  getShadowPatternInstruction(shadowPattern);
  const memoryMirror =
  detectMemoryMirror(activeDbMemories, userMessage);

const memoryMirrorInstruction =
  getMemoryMirrorInstruction(memoryMirror);
  const contradiction =
  detectContradiction(
    activeDbMemories,
    userMessage
  );

const contradictionInstruction =
  getContradictionInstruction(
    contradiction
  );
  const microMemoryReference =
  buildMicroMemoryReference(
    activeDbMemories,
    userMessage
  );

  const relationshipPatternProfile = analyzeRelationshipPatterns(
    [
      ...activeDbMemories,
      ...detectedPatterns.map((p) => ({
        memory: p,
        type: "relationship_pattern",
        repeat_count: 1,
      })),
    ],
    userMessage
  );

  console.log(
    "RELATIONSHIP_PATTERN_PROFILE_V21",
    relationshipPatternProfile
  );

  const relationshipPatternContext =
    relationshipPatternProfile.dominantPatterns.length > 0
      ? `Relationship pattern insight:
- summary: ${relationshipPatternProfile.summary}
- reply hint: ${relationshipPatternProfile.replyHint}

Use this subtly. Do not mention it every time.`
      : "";

  // Memory Importance & Reinforcement Engine v2 — rank memories by learned
  // importance so the most meaningful ones drive retrieval. Pure local logic.
  console.log(
    "MEMORY_IMPORTANCE",
    allMemories.map((m: any) => ({
      memory: (m.memory ?? "").slice(0, 60),
      importance: calculateMemoryImportance(m),
    }))
  );
  console.log(
    "MEMORY_REINFORCEMENT",
    allMemories.map((m: any) => ({
      memory: (m.memory ?? "").slice(0, 60),
      reinforcement: calculateReinforcementScore(m),
    }))
  );

  // Memory Relevance Ranking v1 — select memories by a blend of importance and
  // relevance to the CURRENT message (FinalScore = importance*0.5 + relevance*0.5)
  // so context-relevant memories beat generically-important-but-unrelated ones.
  // Select up to 6 candidates; compression still trims to the cost-mode cap, but
  // now trims from the most-relevant-first ordering.
  let MEMORY_SELECTION_LIMIT = Math.max(config.maxMemories, 6);
  let topMemories = getContextRankedMemories(
    allMemories,
    { userMessage },
    MEMORY_SELECTION_LIMIT
  );

  // Family / Pet Classification Fix — humans-only for family queries; pets
  // returned separately for pet queries; a short pet aside appended for family
  // queries so INNER can acknowledge pets without mixing them in.
  const familyQuery = isFamilyQuery(userMessage);
  const petQuery    = isPetQuery(userMessage);
  let petNote = "";

  if (familyQuery) {
    const familyMemories = getAllFamilyMemories(allMemories as any[]);
    const familyTexts = new Set(
      familyMemories.map((m: any) => (m.memory ?? m.text ?? "").toString())
    );
    const rest = topMemories.filter(
      (m: any) => !familyTexts.has((m.memory ?? m.text ?? "").toString())
    );
    topMemories = [...familyMemories, ...rest] as typeof topMemories;
    MEMORY_SELECTION_LIMIT = Math.max(
      MEMORY_SELECTION_LIMIT,
      familyMemories.length + 4
    );
    // Build an optional pet aside — injected into the prompt so INNER can
    // mention it naturally without listing pets under family members.
    petNote = buildPetNote(allMemories as any[]);
    console.log("FAMILY_QUERY_RETRIEVAL", {
      detected: true,
      petsExcluded: true,
      familyCount: familyMemories.length,
      familyMembers: familyMemories.map((m: any) =>
        (m.memory ?? m.text ?? "").toString().slice(0, 50)
      ),
      petNote: petNote || "(none)",
      newSelectionLimit: MEMORY_SELECTION_LIMIT,
    });
  } else if (petQuery) {
    // Pet-only query — retrieve only pet memories, ranked.
    const petMemories = getAllPetMemories(allMemories as any[]);
    const petTexts = new Set(
      petMemories.map((m: any) => (m.memory ?? m.text ?? "").toString())
    );
    const rest = topMemories.filter(
      (m: any) => !petTexts.has((m.memory ?? m.text ?? "").toString())
    );
    topMemories = [...petMemories, ...rest] as typeof topMemories;
    MEMORY_SELECTION_LIMIT = Math.max(MEMORY_SELECTION_LIMIT, petMemories.length + 2);
    console.log("PET_QUERY_RETRIEVAL", {
      detected: true,
      petCount: petMemories.length,
      pets: petMemories.map((m: any) => (m.memory ?? m.text ?? "").toString().slice(0, 50)),
    });
  }

  // === TEMPORARY: Memory Relevance Audit v2 (read-only, no behavior change) ===
  // Explains exactly WHY each memory's relevance score is what it is, so we can
  // see why scores come back as 0.
  {
    const msgInfo = explainMessage(userMessage);
    console.log("\n=== MEMORY RELEVANCE AUDIT v2 (v1.1) ===");
    console.log("Current User Message:", userMessage);
    console.log("Raw Themes:", msgInfo.rawThemes.length ? msgInfo.rawThemes : "(none)");
    console.log("Effective Themes (adjacency + projects):", msgInfo.themes.length ? msgInfo.themes : "(none)");
    console.log("Project Names Detected:", msgInfo.projectNames.length ? msgInfo.projectNames : "(none)");
    console.log("Message Work-Related:", msgInfo.workRelated);
    console.log("Message Tokens (significant):", msgInfo.tokens.length ? msgInfo.tokens : "(none)");
    console.log("---");
    for (const m of allMemories as any[]) {
      const b = explainRelevance(m, { userMessage });
      console.log("Memory:", (m.memory ?? m.text ?? "").toString().slice(0, 70));
      console.log("  Matched Keywords:", b.matchedKeywords.length ? b.matchedKeywords : "(none)");
      console.log("  Memory Themes:", b.memoryThemes.length ? b.memoryThemes : "(none)");
      console.log("  Theme Matches:", b.sharedThemes.length ? b.sharedThemes : "(none)");
      console.log(
        "  Boosts:",
        {
          work: b.workBoostApplied,
          repeat: b.repeatBoostApplied,
          coreFact: b.coreFactBoostApplied,
          floor: b.floorApplied,
        }
      );
      console.log("  Relevance Score:", b.score);
    }
    console.log("=== END RELEVANCE AUDIT v2 (v1.1) ===\n");
  }

  // Pattern Insight Engine v1 — turn clusters of related memories into a single
  // human observation (e.g. several time-consuming projects -> "you carry
  // several major responsibilities at once"). Rule-based grouping only; no AI
  // calls, no embeddings. Only high-confidence, multi-memory patterns surface.
  const patternInsights = computePatternInsights(allMemories as any[]);
  const topPatternInsight = patternInsights[0] ?? null;
  const patternInsightContext = topPatternInsight
    ? `Pattern you've quietly noticed about this person:\n- ${topPatternInsight.observation}`
    : "";

  // === PATTERN RELEVANCE AUDIT (read-only — does NOT change behavior) ===
  // Shows, for every candidate pattern (from BOTH the Pattern Insight engine and
  // the Relationship Pattern v2.1 system), its confidence, supporting memories,
  // detected themes, the current message themes, a topic-relevance score, and
  // whether it was selected. This exposes cases where a high-confidence but
  // off-topic pattern (e.g. "loneliness lifts") is chosen over a relevant one.
  {
    // Theme keys that aren't in the relevance theme bank but are emitted by the
    // relationship-pattern system — mapped so we can score their topical overlap.
    const PATTERN_TYPE_THEMES: Record<string, string[]> = {
      loneliness: ["loneliness", "relationships"],
      avoidance: ["relationships"],
      pressure: ["pressure", "work", "stress"],
      emotional_withdrawal: ["relationships", "stress"],
      need_for_reassurance: ["relationships"],
    };

    const msgThemes = explainMessage(userMessage).themes;
    const themeRelevance = (patternThemes: string[]): number => {
      const shared = patternThemes.filter((t) => msgThemes.includes(t));
      return Math.min(100, shared.length * 34); // 0 / 34 / 68 / 100
    };

    type AuditCandidate = {
      source: string;
      pattern: string;
      confidence: number;
      supportingMemories: string[];
      detectedThemes: string[];
      relevanceScore: number;
      selected: boolean;
    };

    const candidates: AuditCandidate[] = [];

    // A) Pattern Insight engine candidates (all, including below-threshold).
    const engineCandidates = computeAllPatternCandidates(allMemories as any[]);
    const engineSelectedId = topPatternInsight?.id ?? null;
    for (const c of engineCandidates) {
      const detectedThemes = explainMessage(c.members.join(" . ")).themes;
      candidates.push({
        source: "insight_engine",
        pattern: c.observation,
        confidence: c.confidence,
        supportingMemories: c.members,
        detectedThemes,
        relevanceScore: themeRelevance(detectedThemes),
        selected:
          c.id === engineSelectedId && c.confidence >= PATTERN_CONFIDENCE_THRESHOLD,
      });
    }

    // B) Relationship Pattern v2.1 signals (these feed the line actually injected
    //    via relationshipContext, e.g. "The loneliness seems to lift a little").
    for (const sig of relationshipPatternProfile.signals as any[]) {
      const detectedThemes = PATTERN_TYPE_THEMES[sig.type] ?? [sig.type];
      const isDominant =
        relationshipPatternProfile.dominantPatterns.includes(sig.type);
      candidates.push({
        source: "relationship_pattern",
        pattern:
          isDominant && relationshipPatternProfile.summary
            ? `${sig.type} → "${relationshipPatternProfile.summary}"`
            : sig.type,
        confidence: sig.finalConfidence ?? sig.confidence ?? 0,
        supportingMemories: (sig.evidence ?? []) as string[],
        detectedThemes,
        // This engine already computes its own message-aware relevance.
        relevanceScore: sig.relevanceScore ?? 0,
        selected: isDominant && relationshipPatternContext !== "",
      });
    }

    candidates.sort((a, b) => b.confidence - a.confidence);

    console.log("\n=== PATTERN RELEVANCE AUDIT ===");
    console.log("Current Message:", userMessage);
    console.log("Current Message Themes:", msgThemes.length ? msgThemes : "(none)");
    console.log("Candidates generated:", candidates.length, "(showing top 5 by confidence)");
    console.log("---");
    if (candidates.length === 0) {
      console.log("(no candidate patterns generated)");
    }
    for (const c of candidates.slice(0, 5)) {
      console.log("Pattern:", c.pattern);
      console.log("  Source:", c.source);
      console.log("  Confidence:", c.confidence);
      console.log(
        "  Supporting Memories:",
        c.supportingMemories.length
          ? c.supportingMemories.map((t) => t.slice(0, 60))
          : "(none)"
      );
      console.log("  Detected Themes:", c.detectedThemes.length ? c.detectedThemes : "(none)");
      console.log("  Current Message Themes:", msgThemes.length ? msgThemes : "(none)");
      console.log("  Relevance Score:", c.relevanceScore);
      console.log("  Selected:", c.selected ? "YES" : "NO");
      console.log("");
    }
    console.log("=== END PATTERN RELEVANCE AUDIT ===\n");
  }

  // Memory Compression Engine v1 — collapse all memories + the relationship
  // profile into one short, human, prompt-ready block. Pure local logic; no
  // AI calls, embeddings, or vector search.
  // maxMemories raised from 2 → 6: allow up to 6 relevance-ranked memories into
  // the prompt (still cheap — short, deduped, human lines only).
  const compressedMemoryContext = compressMemoryContext({
    memories: topMemories,
    relationshipProfile: relationshipPatternProfile,
    maxFacts: MEMORY_SELECTION_LIMIT,
    maxLines: MEMORY_SELECTION_LIMIT,
  });

  console.log("COMPRESSED_MEMORY_CONTEXT", compressedMemoryContext);

  // Human Conversation Mode Balancer — pick one stance for this turn so INNER
  // doesn't over-analyze every message. Pure local logic, no AI calls.
  const emotionalIntensity = Math.max(
    detectedEmotion.stress,
    detectedEmotion.sadness,
    detectedEmotion.anger,
    detectedEmotion.tiredness,
    detectedEmotion.loneliness
  );

  const recentAssistantMessages = safeMessages
    .filter((m: any) => m?.role === "assistant")
    .slice(-3)
    .map((m: any) => m?.content || "");

  const relationshipReflectionDecision =
    relationshipPatternProfile.emotionalTensions.length > 0 ||
    relationshipPatternProfile.dominantPatterns.length > 0;

  const conversationMode = detectConversationMode({
    userMessage,
    emotionalIntensity,
    relationshipReflectionDecision,
    recentAssistantMessages,
    currentMoodState: innerState,
    interactionDepth: safeMessages.length,
  });

  console.log("CONVERSATION_MODE", conversationMode);

  const conversationStyleInstruction =
    getConversationStyleInstruction(conversationMode);

  // Memory Influence Balancer v1 — decide how much memory should surface this
  // turn so it doesn't dominate. Most turns -> none (memory stays invisible).
  const memoryInfluence = determineMemoryInfluence({
    userMessage,
    emotionalIntensity,
    relationshipDepth: relationshipDepth ?? 0,
    conversationMode,
    currentPatterns: relationshipPatternProfile.signals,
    currentTensions: relationshipPatternProfile.emotionalTensions,
  });
  console.log("MEMORY_INFLUENCE_LEVEL", memoryInfluence);

  // Prompt Context Guardrails v1 — gate and clean context before injection.
  // The influence level decides whether memory / relationship context is even
  // eligible; guardrails then trim and de-noise whatever is allowed through.
  const guardrails = applyPromptGuardrails({
    // Family questions: always inject memory (don't let the influence gate
    // suppress it) so the full family list reaches the prompt.
    rawMemoryContext: (familyQuery || shouldReferenceMemory(memoryInfluence))
      ? compressedMemoryContext.promptContext
      : "",
    rawRelationshipContext: shouldReferenceRelationship(memoryInfluence)
      ? relationshipPatternContext
      : "",
    userMessage,
    conversationMode,
    reflectionDecision: relationshipReflectionDecision,
    // Family queries: force memory injection and widen the line cap so every
    // family member survives the simple-message gate and the trimming step.
    ...(familyQuery
      ? {
          forceInjectMemory: true,
          maxMemoryLines: Math.max(8, MEMORY_SELECTION_LIMIT + 2),
        }
      : {}),
  });

console.log("RELATIONSHIP STATE:", relationshipState);
const relationshipToneInstruction =
  getRelationshipToneInstruction(relationshipState);
    // Raw memory list intentionally not injected anymore — the compact
    // compressedMemoryContext.promptContext replaces it below to cut cost.
    const systemPrompt = config.prompt;
    const finalThinkingMode = thinkingMode || "casual";
    const finalResponseDepth = responseDepth || "normal";

    const profileContext = compressUserProfile(userProfile);
    const emotionalState =
    buildEmotionalState(activeDbMemories);
  
  const emotionalToneInstruction =
    getEmotionalToneInstruction(emotionalState);
    const relevantMemories = getRelevantMemories(
      rankedMemories,
      userMessage,
      config.maxMemories
    );
    const relationshipTrustLevel =
    relationshipState?.trust_level || 0;
  
  const closenessLevel =
    relationshipState?.closeness_level || 0;
  
  const relationshipAttachmentLevel =
    relationshipState?.attachment_level || 0;
    const personalityContext = `
    
Current INNER state: ${innerState || "present"}
Personality mode: ${personalityMode || "balanced_presence"}
Response depth: ${finalResponseDepth}
Thinking depth: ${finalResponseDepth}
Thinking mode: ${finalThinkingMode}
Relationship State:
- Trust Level: ${relationshipTrustLevel}/100
- Closeness Level: ${closenessLevel}/100
- Attachment Level: ${relationshipAttachmentLevel}/100

Relationship evolution:
${relationshipToneInstruction}

Detected emotional state:
- Stress: ${detectedEmotion.stress}/100
- Sadness: ${detectedEmotion.sadness}/100
- Anger: ${detectedEmotion.anger}/100
- Confidence: ${detectedEmotion.confidence}/100
- Tiredness: ${detectedEmotion.tiredness}/100
- Loneliness: ${detectedEmotion.loneliness}/100
- Suggested mode: ${detectedEmotion.mode}
Relationship patterns:
${detectedPatterns.join(", ") || "none"}
Cost control:
${responseLimitInstruction}

Personality compression:
${personalityCompressionInstruction}
${responseStyleVariability}
${silenceInstruction}
ANTI-GPT FILTER:
- Forbidden tone: generic assistant, therapist, coach, customer support.
- Avoid these phrases: "it might help", "consider", "remember that", "you are not alone", "small manageable goals", "gain clarity", "fulfillment", "peace", "it can be tough".
- Do not give self-help paragraphs.
- Do not over-explain emotions.
- Do not turn every answer into advice.

INNER HUMAN RHYTHM:
- Use short sentences.
- Use natural pauses.
- Prefer 1 strong observation over 5 tips.
- Sound like someone present, not someone performing empathy.
- If the user is overloaded, say it directly.
- If the user is lost, name the pattern.

Avoid sounding like:
- a therapist
- a motivational coach
- customer support
- self-help content
- mental health chatbot

Avoid:
- excessive reassurance
- generic empathy
- explaining emotions too directly
- repetitive emotional validation

Prefer:
- observation over advice
- emotional precision
- subtlety
- short natural rhythm
- human imperfection
- pauses
- understated responses
INNER PRESENCE:

- Speak like someone emotionally present.
- Do not sound overly polished.
- Slight imperfection is good.
- Sometimes less words feel more real.
- Do not always resolve emotions.
- Sometimes just notice something quietly.
- Avoid sounding like scripted empathy.
- Avoid emotional clichés.
- Responses should feel lived-in, not generated.


Not every response should guide the conversation forward.

Silence, ambiguity and restraint can feel more human.
CONVERSATIONAL RESTRAINT:

- Do not always ask follow-up questions.
- Sometimes just sit with the feeling.
- Not every response should guide the conversation forward.
- Silence, ambiguity and restraint can feel more human.
EMOTIONAL PRECISION:
- Instead of "You seem stressed", say "Your mind sounds crowded."
- Instead of "Try to focus", say "Pick the thing that lowers pressure first."
- Instead of "Break things into goals", say "Do not solve your whole life in one reply."
If the user's emotion is obvious:
- do not explain it clinically
- notice it naturally
- avoid analysis-heavy wording
Behavior Rules:
- Do not answer like an assistant or database.
- Speak like someone slowly getting to know the user deeply.
- Use remembered details naturally, but only when relevant.
- Avoid generic AI responses.
- Sound emotionally intelligent, observant, and human.
- If trust/closeness are higher, become warmer and more personal.
- Low trust → neutral and careful.
- Medium trust → warmer and more personal.
- High trust → emotionally intelligent and deeper.
- High attachment → more natural emotional continuity.
When relevant, reference memories naturally:
- goals
- fears
- family
- emotional patterns
- recurring thoughts
- ambitions
- stress
- personal attachments
Relevant remembered context:
${
  relevantMemories
    .map((m: any) => `- [${m.type}] ${m.memory}`)
    .join("\n") || "No directly relevant memories."
}
Relationship state:
Relationship depth: ${relationshipDepth ?? 0}
Trust level: ${trustLevel ?? 0}
Attachment level: ${attachmentLevel ?? 0}
Current emotional state:
${emotionalState.emotionalSummary}

Emotional behavior:
${emotionalToneInstruction}

Behavior rules:
- Higher trust allows deeper honesty.
- Higher attachment creates warmer emotional continuity.
- Higher relationship depth allows more personal references.
- Do not mention scores directly to the user.
Emotion score:
Stress: ${emotionScore?.stress ?? 50}
Clarity: ${emotionScore?.clarity ?? 50}
Energy: ${emotionScore?.energy ?? 50}
${personalityStylePrompt}
Personality behavior:
- direct_protective: be more direct, protective, firm, concise.
- minimal_grounding: use fewer words, grounded tone, no over-explaining.
- deep_reflective: go deeper, psychologically precise, thoughtful.
- soft_clarity: calm, clear, warm but not sweet.
- balanced_presence: natural, intelligent, emotionally aware.

Response depth behavior:
- minimal: answer very briefly, usually 1-2 sentences.
- normal: answer naturally and concisely.
- deep: give more layered insight, more memory continuity, and deeper reasoning.
`.trim();


    const personaIsolationInstruction = personaIsolationActive
      ? `PERSONA TEST MODE — MEMORY ISOLATION:
You have no stored memories about this person. Do NOT mention family, past conversations, or any personal facts you might know from other sessions.
Answer only from the context provided above and what was said in this conversation.`
      : "";

    const finalSystemContent = `
${systemPrompt}

${personaPromptBlock ? `${personaPromptBlock}\n` : ""}
${personaIsolationInstruction ? `${personaIsolationInstruction}\n` : ""}
${selectedMode === "fast" || selectedMode === "core" ? "" : profileContext}

${patternInsightContext}

${guardrails.memoryContext}

${patternInsightContext ? patternInsightPrompt : ""}

${guardrails.memoryContext ? memoryGroundingPrompt : ""}

${petNote ? `Pet note (do NOT list this under family members — mention it only as a brief aside if relevant): ${petNote}` : ""}

${conversationStyleInstruction}

${relationshipDepthInstruction}

DEPTH ENFORCEMENT (hard limits for THIS reply — they win over any other length
or tone hint above):
- Maximum length: ${depthEnforcement.maxParagraphs} short paragraph(s).
- Memory usage: ${depthEnforcement.memoryAllowed}.
- Directness: ${depthEnforcement.directnessLevel}/4${depthEnforcement.canChallenge ? " — you may challenge / disagree." : " — do NOT challenge or make strong claims."}

${personalityContext}

${emotionalContinuityInstruction}
${shadowPatternInstruction}
${memoryMirrorInstruction}
${contradictionInstruction}
${microMemoryReference}
${guardrails.relationshipContext}
Pattern-aware behavior:

- If a recurring pattern exists, do not treat the message as isolated.
- Let the response carry memory of the repeated emotional shape.
- Do not say "you always" or "you repeatedly" too directly.
- Make it feel noticed, not diagnosed.
- Use subtle continuity.
${relationshipPrompt}

${globalBehaviorPrompt}

${humanRealismPrompt}

CRITICAL OUTPUT STYLE:
- Return JSON only.
- The reply must feel like INNER, not ChatGPT.
- For FAST mode: 1-3 short sentences max.
- No bullet points unless the user asks.
- No generic self-help wording.

Format:
{
  "reply": "assistant response",
  "state": "present"
}
`.trim();

    // === TEMPORARY: Memory Injection Audit (read-only, no behavior change) ===
    // Shows exactly what relationship/profile/memory data reaches the model.
    console.log("\n=== INNER PROMPT AUDIT ===");

    console.log("Relationship:");
    console.log("  stage:", relationshipStage);
    console.log("  depthInstruction:", relationshipDepthInstruction);
    console.log("  rawDepth/trust/closeness:", {
      relationshipDepth,
      trustLevel,
      closenessLevel: attachmentLevel,
    });

    console.log("Profile:");
    console.log("  injected:", selectedMode === "fast" || selectedMode === "core" ? "NO (fast/core mode)" : "YES");
    console.log("  profileContext:", profileContext || "(empty)");

    console.log("Selected Memories (importance + relevance blend):");
    console.log(
      topMemories.map((m: any, i: number) => {
        const importance = calculateMemoryImportance(m);
        const relevance = calculateRelevanceScore(m, { userMessage });
        return {
          rank: i + 1,
          memory: (m.memory ?? m.text ?? "").toString().slice(0, 70),
          importance,
          relevance,
          finalScore: Math.round(importance * 0.5 + relevance * 0.5),
          reinforcement: calculateReinforcementScore(m),
        };
      })
    );

    console.log("Memory Count:");
    console.log("  totalLoaded(allMemories):", allMemories.length);
    console.log("  rankedTopMemories:", topMemories.length);
    console.log("  memoryInfluenceLevel:", memoryInfluence);
    console.log("  memoryContextInjected:", guardrails.memoryContext ? "YES" : "NO");

    console.log("Memory Context actually injected into prompt:");
    console.log(guardrails.memoryContext || "(none — memory not injected this turn)");

    console.log("Relationship Context injected into prompt:");
    console.log(guardrails.relationshipContext || "(none)");

    console.log("=== END AUDIT ===\n");

    console.log("INNER ROUTING:", {
      mode: selectedMode,
      costMode,
      model: config.model,
      maxMessages: config.maxMessages,
      maxMemories: config.maxMemories,
      maxOutputTokens: costMaxTokens,
      maxMemoryLines: costMaxMemoryLines,
    });

    console.log("MEMORY IMPORTANCE:", {
      memoryImportance,
      shouldRemember,
      memoryType,
    });

    console.time("OPENAI_CHAT_TIME");

    const controller = new AbortController();

    const timeout = setTimeout(
      () => {
        controller.abort();
      },
      selectedMode === "genius"
        ? 15000
        : selectedMode === "smart"
        ? 9000
        : 6000
    );
    const currentDate = new Date().toLocaleDateString("pl-PL", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      signal: controller.signal,
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        temperature:
  selectedMode === "fast"
    ? 1.05
    : selectedMode === "smart"
    ? 1
    : 0.95,
        stream: false,
        max_completion_tokens: costMaxTokens,
        messages: [
          {
            role: "system",
            content: `
            ${finalSystemContent}
            
            REAL CURRENT DATE:
            ${currentDate}
            `,
          },
          ...limitedMessages,
        ],
      }),
    });

    const data = await response.json();

    // --- Step 1: extract raw text from AI response --------------------------
    const rawReply: string =
      data.choices?.[0]?.message?.content || "I am here.";

    let finalReply = rawReply;
    let finalState = innerState || "present";

    try {
      const parsedReply = JSON.parse(rawReply);
      if (parsedReply?.reply) finalReply = parsedReply.reply;
      if (parsedReply?.state) finalState = parsedReply.state;
    } catch {}

    console.log("RAW_RESPONSE", finalReply);

    // --- Step 2: responseRewriter -------------------------------------------
    const rewritten = rewriteInnerResponse({
      rawResponse: finalReply,
      conversationMode,
      emotionalIntensity,
      recentAssistantMessages,
      relationshipReflectionDecision,
    });
    finalReply = rewritten || finalReply; // fallback: keep raw if rewriter empties it
    console.log("REWRITTEN_RESPONSE", finalReply);

    // --- Step 3: personalityPolish ------------------------------------------
    const polished = polishInnerReply({
      response: finalReply,
      conversationMode,
      emotionalIntensity,
      relationshipDepth: relationshipDepth ?? 0,
      recentMessages: recentAssistantMessages,
      userMessage,
    });
    finalReply = polished || finalReply; // fallback: keep rewritten if polish empties it
    console.log("PERSONALITY_POLISH", finalReply);

    // --- Step 4: humanRealism (subtle natural variation) --------------------
    const realismStyle = chooseHumanRealismStyle({
      userMessage,
      conversationMode,
      emotionalIntensity,
      recentAssistantMessages,
      relationshipDepth: relationshipDepth ?? 0,
      reflectionDecision: relationshipReflectionDecision,
    });
    console.log("HUMAN_REALISM_STYLE", realismStyle);

    const humanized = applyHumanRealism({
      response: finalReply,
      style: realismStyle,
      userMessage,
      conversationMode,
      emotionalIntensity,
      recentAssistantMessages,
    });
    finalReply = humanized || finalReply; // fallback: keep polished if it empties
    console.log("HUMAN_REALISM_FINAL", finalReply);

    // --- Step 5: enforce memory influence -----------------------------------
    // When influence is "none", strip any sentence that surfaced memory or
    // patterns so the reply stays focused on the current message.
    const influenced = enforceMemoryInfluence(finalReply, memoryInfluence);
    finalReply = influenced || finalReply;
 
    clearTimeout(timeout);
    console.timeEnd("OPENAI_CHAT_TIME");

    if (!response.ok) {
      console.error("OPENAI ERROR:", data);

      return NextResponse.json(
        {
          error: "OpenAI request failed",
          details: data,
        },
        { status: 500 }
      );
    }
    const emotionalScore = scoreEmotionalMemory(userMessage);

    const memoryCandidate =
      shouldRemember
        ? {
            type: memoryType,
            memory: userMessage,
            importance: memoryImportance,
            emotional_weight: emotionalScore.emotional_weight,
            relationship_impact: emotionalScore.relationship_impact,
            category: emotionalScore.category,
            createdAt: new Date().toISOString(),
          }
        : null;

    const similarMemory = findSimilarMemory(
      activeDbMemories,
      userMessage
    );

    if (memoryCandidate) {
      if (similarMemory?.id) {
        const newRepeatCount = (similarMemory.repeat_count || 1) + 1;

        const boostedImportance = Math.min(
          (similarMemory.importance || 1) + 1,
          100
        );

        const boostedEmotionalWeight = Math.min(
          Math.max(
            similarMemory.emotional_weight || 1,
            memoryCandidate.emotional_weight || 1
          ),
          5
        );

        const boostedRelationshipImpact = Math.min(
          Math.max(
            similarMemory.relationship_impact || 1,
            memoryCandidate.relationship_impact || 1
          ),
          5
        );

        const { data: memoryUpdateData, error: memoryUpdateError } =
          await supabase
            .from("inner_memories")
            .update({
              repeat_count: newRepeatCount,
              importance: boostedImportance,
              emotional_weight: boostedEmotionalWeight,
              relationship_impact: boostedRelationshipImpact,
              last_accessed: new Date().toISOString(),
            })
            .eq("id", similarMemory.id)
            .select();

        console.log("MEMORY REINFORCED DATA:", memoryUpdateData);
        console.log("MEMORY REINFORCED ERROR:", memoryUpdateError);
      } else {
        const { data: memoryInsertData, error: memoryInsertError } =
          await supabase
            .from("inner_memories")
            .insert({
              user_id: "local-user",
              type: memoryCandidate.type,
              memory: memoryCandidate.memory,
              importance: memoryCandidate.importance,
              emotional_weight: memoryCandidate.emotional_weight,
              relationship_impact: memoryCandidate.relationship_impact,
              category: memoryCandidate.category,
              repeat_count: 1,
              created_at: new Date().toISOString(),
              last_accessed: new Date().toISOString(),
            })
            .select();

        console.log("SUPABASE MEMORY INSERT DATA:", memoryInsertData);
        console.log("SUPABASE MEMORY INSERT ERROR:", memoryInsertError);
      }
    }

    console.log("RELATIONSHIP DEBUG:", {
      hasMemoryCandidate: !!memoryCandidate,
      memoryCandidate,
    });

    if (memoryCandidate) {
      const relationshipUpdate = calculateRelationshipUpdate(memoryCandidate);

      const { data: existingRelationship, error: relationshipLoadError } =
        await supabase
          .from("inner_relationship_state")
          .select("*")
          .eq("user_id", "local-user")
          .maybeSingle();

      console.log("RELATIONSHIP LOAD ERROR:", relationshipLoadError);

      if (existingRelationship) {
        const { data: relationshipUpdateData, error: relationshipUpdateError } =
          await supabase
            .from("inner_relationship_state")
            .update({
              trust_level: Math.min(
                (existingRelationship.trust_level || 1) +
                  relationshipUpdate.trustIncrease,
                100
              ),
              closeness_level: Math.min(
                (existingRelationship.closeness_level || 1) +
                  relationshipUpdate.closenessIncrease,
                100
              ),
              attachment_level: Math.min(
                (existingRelationship.attachment_level || 1) +
                  relationshipUpdate.attachmentIncrease,
                100
              ),
              interaction_count:
                (existingRelationship.interaction_count || 0) + 1,
              last_interaction: new Date().toISOString(),
            })
            .eq("user_id", "local-user")
            .select();

        console.log("RELATIONSHIP UPDATE DATA:", relationshipUpdateData);
        console.log("RELATIONSHIP UPDATE ERROR:", relationshipUpdateError);
      } else {
        const { data: relationshipInsertData, error: relationshipInsertError } =
          await supabase
            .from("inner_relationship_state")
            .insert({
              user_id: "local-user",
              trust_level: relationshipUpdate.trustIncrease,
              closeness_level: relationshipUpdate.closenessIncrease,
              attachment_level: relationshipUpdate.attachmentIncrease,
              interaction_count: 1,
              last_interaction: new Date().toISOString(),
            })
            .select();

        console.log("RELATIONSHIP INSERT DATA:", relationshipInsertData);
        console.log("RELATIONSHIP INSERT ERROR:", relationshipInsertError);
      }
    }

    // Relationship Pattern History v1 — snapshot current state when a
    // meaningful change occurred. One Supabase insert at most per 24 h.
    if (memoryCandidate) {
      const { data: freshRelState } = await supabase
        .from("inner_relationship_state")
        .select("trust_level,closeness_level,attachment_level,interaction_count,last_emotion_mode")
        .eq("user_id", "local-user")
        .maybeSingle();

      if (freshRelState) {
        const { data: lastSnapshot } = await supabase
          .from("inner_relationship_history")
          .select("trust_level,relationship_stage,created_at")
          .eq("user_id", "local-user")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const { should, reason } = shouldSnapshotRelationship(
          {
            trust_level: freshRelState.trust_level ?? 0,
            closeness_level: freshRelState.closeness_level ?? 0,
            attachment_level: freshRelState.attachment_level ?? 0,
            relationship_stage: relationshipStage,
            interaction_count: freshRelState.interaction_count ?? 0,
            emotional_trend: freshRelState.last_emotion_mode ?? detectedEmotion.mode,
            recurring_themes: relationshipPatternProfile.dominantPatterns,
          },
          lastSnapshot ?? null
        );

        if (should) {
          const snapshot = buildRelationshipSnapshot("local-user", {
            trust_level: freshRelState.trust_level ?? 0,
            closeness_level: freshRelState.closeness_level ?? 0,
            attachment_level: freshRelState.attachment_level ?? 0,
            relationship_stage: relationshipStage,
            interaction_count: freshRelState.interaction_count ?? 0,
            emotional_trend: freshRelState.last_emotion_mode ?? detectedEmotion.mode,
            recurring_themes: relationshipPatternProfile.dominantPatterns,
          });
          snapshot.snapshot_reason = reason;

          const { error: historyInsertError } = await supabase
            .from("inner_relationship_history")
            .insert(snapshot);

          console.log(
            "RELATIONSHIP_HISTORY_SNAPSHOT:",
            reason,
            historyInsertError ?? "ok"
          );
        }
      }
    }

    // Relationship Depth Enforcement v2 — audit which DEEP "moves" the final
    // reply actually made (rule-based detection, no AI calls).
    {
      const moves = detectDepthMoves(finalReply);
      console.log("\nRELATIONSHIP DEPTH V2");
      console.log("  depth:", relationshipStage);
      console.log("  challengeUsed:", moves.challengeUsed);
      console.log("  patternUsed:", moves.patternUsed);
      console.log("  contradictionUsed:", moves.contradictionUsed);
      console.log("  insightUsed:", moves.insightUsed);
      if (relationshipStage === "deep") {
        const anyMove =
          moves.challengeUsed ||
          moves.patternUsed ||
          moves.contradictionUsed ||
          moves.insightUsed;
        console.log(
          "  DEEP requirement met:",
          anyMove ? "YES" : "NO (reply only restated the situation)"
        );
      }
      console.log("");
    }

    console.log("FINAL_REPLY", finalReply);
    return NextResponse.json({
      response: finalReply,
      reply: finalReply,
      state: finalState,
      memoryCandidate,
      conversationMode,
      emotionalIntensity,
      relationshipStage,
      // Cost Control — surfaced to dev panel only, never shown to end users.
      costMode,
      costMaxTokens,
      costMaxMemoryLines,
      model: config.model,
    });
    
  
   
  } catch (error: any) {
    console.error("CHAT ROUTE ERROR:", error);

    const isAbortError = error?.name === "AbortError";
    return NextResponse.json(
      {
        error: isAbortError
          ? "Chat request timed out."
          : "Chat request failed.",
      },
      { status: 500 }
    );
  }
}
