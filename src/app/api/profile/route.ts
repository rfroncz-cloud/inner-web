import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ profile: [] });
    }

    const recentMessages = messages
      .slice(-16)
      .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
      .join("\n");

    const prompt = `
You are INNER long-term memory system.

Create 1 to 3 short user profile memories based on recurring emotional or behavioral patterns.

Return ONLY valid JSON:
{"profile":["memory one","memory two"]}

Rules:
- Each memory should be one sentence.
- Focus on stable patterns, not temporary moods.
- Do not diagnose.
- Do not include sensitive labels.
- Write naturally and respectfully.

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
        temperature: 0.3,
        messages: [{ role: "system", content: prompt }],
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    const parsed = JSON.parse(content);

    return NextResponse.json({
      profile: Array.isArray(parsed.profile) ? parsed.profile.slice(0, 5) : [],
    });
  } catch {
    return NextResponse.json({ profile: [] });
  }
}