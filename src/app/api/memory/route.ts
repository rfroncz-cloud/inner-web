import { NextResponse } from "next/server";

type Memory = {
  type: string;
  memory: string;
};

export async function POST(req: Request) {
  try {
    const { messages, memories } = await req.json();

    const text = Array.isArray(messages)
      ? messages.map((m: any) => m.content).join(" ").toLowerCase()
      : "";

    const existing: Memory[] = Array.isArray(memories) ? memories : [];

    const fallback: Memory[] = [];

    if (
      text.includes("pressure") ||
      text.includes("stress") ||
      text.includes("overthinking") ||
      text.includes("overthink") ||
      text.includes("tension") ||
      text.includes("exhausted")
    ) {
      fallback.push({
        type: "pattern",
        memory:
          "User tends to carry internal pressure and stay mentally over-engaged.",
      });
    }

    if (
      text.includes("alone") ||
      text.includes("handle everything") ||
      text.includes("carry")
    ) {
      fallback.push({
        type: "stress",
        memory:
          "User often feels responsible for handling difficult things alone.",
      });
    }

    if (
      text.includes("control") ||
      text.includes("productive") ||
      text.includes("strong")
    ) {
      fallback.push({
        type: "identity",
        memory:
          "User connects strength with control, responsibility and staying functional.",
      });
    }

    const merged = [...existing];

    for (const item of fallback) {
      const exists = merged.some(
        (m) => m.memory.toLowerCase() === item.memory.toLowerCase()
      );

      if (!exists) {
        merged.push(item);
      }
    }

    return NextResponse.json({
      memories: merged.slice(-8),
    });
  } catch {
    return NextResponse.json({
      memories: [],
    });
  }
}