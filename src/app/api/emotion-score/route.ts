import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        stress: 50,
        clarity: 50,
        energy: 50,
      });
    }

    const recentMessages = messages
      .slice(-12)
      .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
      .join("\n");

    const prompt = `
You are INNER emotional analysis system.

Analyze the user's emotional state from the conversation.

Return ONLY valid JSON in this exact format:
{"stress":72,"clarity":38,"energy":41}

Rules:
- stress, clarity and energy must be numbers from 0 to 100.
- stress means emotional pressure.
- clarity means mental clarity.
- energy means mental/emotional energy.
- Do not include explanations.

Conversation:
${recentMessages}
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        temperature: 0.2,
        messages: [{ role: "system", content: prompt }],
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    const parsed = JSON.parse(content);

    return NextResponse.json({
      stress: parsed.stress ?? 50,
      clarity: parsed.clarity ?? 50,
      energy: parsed.energy ?? 50,
    });
  } catch {
    return NextResponse.json({
      stress: 50,
      clarity: 50,
      energy: 50,
    });
  }
}