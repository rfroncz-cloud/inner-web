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

    const topMemories = getTopMemories(safeMemories, config.maxMemories);
    const limitedMessages = safeMessages.slice(-config.maxMessages);
    const limitedMemories = topMemories;

    const userMessage =
      safeMessages.length > 0
        ? safeMessages[safeMessages.length - 1]?.content || ""
        : "";

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
      limitedMemories.length > 0
        ? `\n\nRelevant memories:\n${limitedMemories
            .map((m: any) =>
              `- ${typeof m === "string" ? m : m.memory || JSON.stringify(m)}`
            )
            .join("\n")}`
        : "";

    const systemPrompt = `${config.prompt}${memoryBlock}`;

    const finalThinkingMode = thinkingMode || "casual";
    const finalResponseDepth = responseDepth || "normal";

    const memoryContext = compressMemories(topMemories);
    const profileContext = compressUserProfile(userProfile);

    const relevantMemories = getRelevantMemories(
      safeMemories,
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
            content: finalSystemContent,
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
    const memoryCandidate =
  shouldRemember && userMessage.length > 10
    ? {
        type: memoryType,
        memory: userMessage,
        importance: memoryImportance,
        createdAt: new Date().toISOString(),
      }
    : null;
    if (memoryCandidate) {
      await supabase.from("inner_memories").insert({
        user_id: "local-user",
        type: memoryCandidate.type,
        memory: memoryCandidate.memory,
        importance: memoryCandidate.importance,
        created_at: new Date().toISOString(),
      });
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
