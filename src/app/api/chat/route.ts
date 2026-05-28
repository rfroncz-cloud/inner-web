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
import { getPersonalityCompressionInstruction } from "@/lib/personalityCompression";
import {
  buildEmotionalState,
  getEmotionalToneInstruction,
  getEmotionalContinuityInstruction,
} from "@/lib/emotionalContinuity";
import { getRelationshipToneInstruction } from "@/lib/relationshipEvolution";
import { getResponseLimitInstruction } from "@/lib/costControl";
import { detectEmotionalState } from "@/lib/emotionalStateEngine";
import { extractPersonalFacts } from "@/lib/personalFactExtractor";
import { shouldDeleteMemory } from "@/lib/memoryCleanup";
import { resolvePersonalFact } from "@/lib/personalFactsResolver";
import { findSimilarMemory } from "@/lib/memoryReinforcement";
import { scoreEmotionalMemory } from "@/lib/emotionalMemoryScoring";
import { rankMemories } from "@/lib/memoryRanking";
import { calculateRelationshipUpdate } from "@/lib/relationshipEngine";
import { getInnerModeConfig, type InnerMode } from "@/lib/innerModes";
import {
  compressUserProfile,
  calculateMemoryImportance,
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
    const allMemories = [
      ...activeDbMemories,
      ...safeMemories,
    ];
    
    // 3. Emotional Memory Ranking Engine
    const rankedMemories = rankMemories(allMemories, Math.max(config.maxMemories, 12));
    
    // 4. Zamiana najlepszych memories na context dla GPT
    
    const limitedMessages = safeMessages.slice(-config.maxMessages);
    
    const memoryImportance = calculateMemoryImportance(userMessage);
    const shouldRemember = shouldSaveMemory(userMessage);
    const memoryType = classifyMemoryType(userMessage);
    const extractedFacts = extractPersonalFacts(userMessage);

    const safeFacts = extractedFacts.filter(
      (fact: any) => !isSensitiveMemory(fact.memory)
    );

console.log("EXTRACTED FACTS:", extractedFacts);

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

  // Memory Compression Engine v1 — collapse all memories + the relationship
  // profile into one short, human, prompt-ready block. Pure local logic; no
  // AI calls, embeddings, or vector search.
  const compressedMemoryContext = compressMemoryContext({
    memories: allMemories,
    relationshipProfile: relationshipPatternProfile,
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

  const conversationMode = detectConversationMode({
    userMessage,
    emotionalIntensity,
    relationshipReflectionDecision:
      relationshipPatternProfile.emotionalTensions.length > 0 ||
      relationshipPatternProfile.dominantPatterns.length > 0,
    recentAssistantMessages,
    currentMoodState: innerState,
    interactionDepth: safeMessages.length,
  });

  console.log("CONVERSATION_MODE", conversationMode);

  const conversationStyleInstruction =
    getConversationStyleInstruction(conversationMode);

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


    const finalSystemContent = `
${systemPrompt}

${selectedMode === "fast" || selectedMode === "core" ? "" : profileContext}

${compressedMemoryContext.promptContext}

${conversationStyleInstruction}

${personalityContext}

${emotionalContinuityInstruction}
${shadowPatternInstruction}
${memoryMirrorInstruction}
${contradictionInstruction}
${microMemoryReference}
${relationshipPatternContext}
Pattern-aware behavior:

- If a recurring pattern exists, do not treat the message as isolated.
- Let the response carry memory of the repeated emotional shape.
- Do not say "you always" or "you repeatedly" too directly.
- Make it feel noticed, not diagnosed.
- Use subtle continuity.
${relationshipPrompt}

${globalBehaviorPrompt}

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

    console.log("INNER ROUTING:", {
      mode: selectedMode,
      model: config.model,
      maxMessages: config.maxMessages,
      maxMemories: config.maxMemories,
      maxOutputTokens: config.maxOutputTokens,
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
        max_completion_tokens: config.maxOutputTokens,
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
    const rawReply =
    data.choices?.[0]?.message?.content ||
    "I am here.";
  
  let finalReply = rawReply;
  let finalState = innerState || "present";
  
  try {
    const parsedReply = JSON.parse(rawReply);
  
    if (parsedReply?.reply) {
      finalReply = parsedReply.reply;
    }
  
    if (parsedReply?.state) {
      finalState = parsedReply.state;
    }
  } catch {}
  finalReply = rewriteInnerResponse(finalReply);
 
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

    return NextResponse.json({
      response: finalReply,
      reply: finalReply,
      state: finalState,
      memoryCandidate,
      conversationMode,
      emotionalIntensity,
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
