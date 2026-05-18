import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing API key" },
        { status: 500 }
      );
    }

    const recentMessages = messages
      .slice(-10)
      .map((m: any) => `${m.role}: ${m.content}`)
      .join("\n");

    const prompt = `
You are INNER memory analysis system.

Analyze the emotional patterns in this conversation.

Return ONLY ONE short sentence.

Examples:
- INNER notices recurring emotional pressure.
- INNER notices signs of mental exhaustion.
- INNER notices fear of disappointing others.
- INNER notices tension between ambition and inner calm.

Conversation:
${recentMessages}
`;

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.7,
          messages: [
            {
              role: "system",
              content: prompt,
            },
          ],
        }),
      }
    );

    const data = await response.json();

    const insight =
      data.choices?.[0]?.message?.content ??
      "INNER is observing emotional patterns.";

    return NextResponse.json({ insight });
  } catch {
    return NextResponse.json(
      {
        insight:
          "INNER is observing emotional patterns.",
      },
      { status: 200 }
    );
  }
}