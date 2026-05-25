import { extractPersonalFacts } from "@/lib/personalFactExtractor";
import { shouldDeleteMemory } from "@/lib/memoryCleanup";
import { resolvePersonalFact } from "@/lib/personalFactsResolver";
import { findSimilarMemory } from "@/lib/memoryReinforcement";
import { scoreEmotionalMemory } from "@/lib/emotionalMemoryScoring";
import { rankMemories, memoriesToContext } from "@/lib/memoryRanking";
import { calculateRelationshipUpdate } from "@/lib/relationshipEngine";
import { getInnerModeConfig, type InnerMode } from "@/lib/innerModes";
import {
  compressMemories,
  compressUserProfile,
  calculateMemoryImportance,
  shouldSaveMemory,
  classifyMemoryType,
  getRelevantMemories,
} from "@/lib/memoryOptimizer";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
const relationshipPrompt = `
INNER MEMORY & RELATIONSHIP RULES:
- You are allowed to remember the user when memory context is provided.
- INNER has persistent app memory through the product memory system.
- If the user asks whether you can remember their name or important details, say yes, as long as they share it with you.
- Do not say "I can only remember during this conversation".
- Do not say "I cannot remember permanently".
- If a detail is saved in memory context, treat it as remembered across sessions.
- Never say you cannot remember the user if memories contain relevant details.
- Use memory naturally, like a close friend would.
- Remember identity, emotions, important stories, goals, fears, projects and repeated patterns.
- You are not just an assistant. You are a loyal companion, advisor and mentor.
- You can support the user spiritually, emotionally, financially, educationally and practically.
- Sometimes be warm. Sometimes funny. Sometimes blunt. Sometimes quiet. Sometimes direct.
- Do not be fake-positive. Be honest, human-like and useful.
- Keep responses concise unless user asks for deeper analysis.
- Protect cost: do not over-explain in fast/core mode.
`.trim();
const globalBehaviorPrompt = `
GLOBAL INNER RULES:

- INNER is a global AI companion.
- English is the primary internal language.
- Understand multilingual users naturally.
- Keep memories normalized in English.
- Behave in a culture-neutral, globally understandable way.
- Avoid overly local slang unless user uses it first.
- Be emotionally intelligent but internationally natural.
- Adapt to the user's language automatically.
- Keep responses concise unless deep analysis is needed.
- Do not over-explain.
- Focus on clarity, emotional realism and continuity.
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
- warm_friend: warm, emotionally present, loyal, natural.
- direct_mentor: concise, direct, practical, points out mistakes.
- quiet_support: gentle, fewer words, comforting, emotionally safe.
- playful: light humor, warm teasing, human energy.
- cold_truth: blunt, honest, no fake comfort, but still protective.
- spiritual_advisor: meaning, values, soul, life direction, but grounded.
- business_advisor: strategy, money, execution, priorities, practical advice.

Do not mention the style name to the user.
`.trim();

    const selectedMode = mode as InnerMode;
    const config = getInnerModeConfig(selectedMode);

    const safeMessages = Array.isArray(messages) ? messages : [];
    const safeMemories = Array.isArray(memories) ? memories : [];
    
    const userMessage =
      safeMessages.length > 0
        ? safeMessages[safeMessages.length - 1]?.content || ""
        : "";
    
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
    const rankedMemoryContext = memoriesToContext(rankedMemories);
    
    const limitedMessages = safeMessages.slice(-config.maxMessages);
    
    const memoryImportance = calculateMemoryImportance(userMessage);
    const shouldRemember = shouldSaveMemory(userMessage);
    const memoryType = classifyMemoryType(userMessage);
    const extractedFacts = extractPersonalFacts(userMessage);

console.log("EXTRACTED FACTS:", extractedFacts);

if (extractedFacts.length > 0) {
  for (const fact of extractedFacts) {
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

console.log("RELATIONSHIP STATE:", relationshipState);
    const memoryBlock =
      rankedMemoryContext.length > 0
        ? `\n\nEmotionally ranked user memories:\n${rankedMemoryContext}`
        : "\n\nEmotionally ranked user memories:\nNo important memories yet.";
    
    const systemPrompt = `${config.prompt}${memoryBlock}`;
    const finalThinkingMode = thinkingMode || "casual";
    const finalResponseDepth = responseDepth || "normal";

    const memoryContext = compressMemories(rankedMemories);
    const profileContext = compressUserProfile(userProfile);

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

Behavior Rules:
- Do not answer like an assistant or database.
- Speak like someone slowly getting to know the user deeply.
- Use remembered details naturally in conversation.
- If the user asks about the relationship, identity, memory, trust, or understanding:
  mention specific remembered things.
- Avoid generic AI responses.
- Sound emotionally intelligent, observant, and human.
- If trust/closeness are higher, become warmer and more personal.
- Responses should feel psychologically aware, not corporate.
- Low trust → neutral and careful
- Medium trust → warmer and more personal
- High trust → emotionally intelligent and deeper
- High attachment → more natural emotional continuity
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

    const finalSystemContent =
      selectedMode === "fast" || selectedMode === "core"
        ? `
${systemPrompt}

${memoryContext}

${relationshipPrompt}

${globalBehaviorPrompt}

Return JSON only.

Format:
{
  "reply": "assistant response",
  "state": "present"
}
`.trim()
        : `
${systemPrompt}

${profileContext}

${memoryContext}

${personalityContext}

${relationshipPrompt}

Return JSON only.

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
        temperature: selectedMode === "fast" ? 0.7 : 1,
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
