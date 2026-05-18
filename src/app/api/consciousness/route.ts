import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages, memories, userProfile } = await req.json();

    const text = [
      ...(Array.isArray(userProfile) ? userProfile : []),
      ...(Array.isArray(memories)
        ? memories.map((m: any) => `${m.type}: ${m.memory}`)
        : []),
      ...(Array.isArray(messages)
        ? messages.slice(-12).map((m: any) => `${m.role}: ${m.content}`)
        : []),
    ].join("\n");

    const observations: string[] = [];

    const lower = text.toLowerCase();

    if (
      lower.includes("pressure") ||
      lower.includes("stress") ||
      lower.includes("tension")
    ) {
      observations.push(
        "User often carries pressure as if relaxing would mean losing control."
      );
    }

    if (
      lower.includes("overthink") ||
      lower.includes("analyze") ||
      lower.includes("thinking")
    ) {
      observations.push(
        "User tends to move into analysis before fully resting emotionally."
      );
    }

    if (
      lower.includes("alone") ||
      lower.includes("handle everything") ||
      lower.includes("carry")
    ) {
      observations.push(
        "User may default to handling difficult things alone instead of letting others in."
      );
    }

    if (
      lower.includes("strong") ||
      lower.includes("productive") ||
      lower.includes("control")
    ) {
      observations.push(
        "User seems to connect strength with staying functional under pressure."
      );
    }

    return NextResponse.json({
      observations: observations.slice(0, 4),
    });
  } catch {
    return NextResponse.json({
      observations: [],
    });
  }
}