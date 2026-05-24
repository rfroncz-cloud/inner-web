import { findSimilarMemory } from "@/lib/memoryReinforcement";
import { scoreEmotionalMemory } from "@/lib/emotionalMemoryScoring";
import { rankMemories, memoriesToContext } from "@/lib/memoryRanking";
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
function getTopMemories(memories: any[], limit: number) {
  if (!Array.isArray(memories)) return [];

  return [...memories]
    .sort((a, b) => {
      const scoreA =
        (a.importance || 1) +
        (a.emotionalWeight || 1) +
        (a.repeatCount || 1);

      const scoreB =
        (b.importance || 1) +
        (b.emotionalWeight || 1) +
        (b.repeatCount || 1);

      return scoreB - scoreA;
    })
    .slice(0, limit);
}

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
    
    // 2. Połącz memories z frontu + memories z Supabase
    const allMemories = [
      ...(Array.isArray(dbMemories) ? dbMemories : []),
      ...safeMemories,
    ];
    
    // 3. Emotional Memory Ranking Engine
    const rankedMemories = rankMemories(allMemories, config.maxMemories);
    
    // 4. Zamiana najlepszych memories na context dla GPT
    const rankedMemoryContext = memoriesToContext(rankedMemories);
    
    const limitedMessages = safeMessages.slice(-config.maxMessages);
    
    const memoryImportance = calculateMemoryImportance(userMessage);
    const shouldRemember = shouldSaveMemory(userMessage);
    const memoryType = classifyMemoryType(userMessage);
    
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY" },
        { status: 500 }
      );
    }
    
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

    const personalityContext = `
Current INNER state: ${innerState || "present"}
Personality mode: ${personalityMode || "balanced_presence"}
Response depth: ${finalResponseDepth}
Thinking depth: ${finalResponseDepth}
Thinking mode: ${finalThinkingMode}

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
          Array.isArray(dbMemories) ? dbMemories : [],
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
