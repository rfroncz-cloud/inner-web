import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { memories = [] } = await req.json();

    if (!Array.isArray(memories)) {
      return NextResponse.json({ error: "Invalid memories" }, { status: 400 });
    }

    const rows = memories
      .filter((m) => m?.memory && m?.type)
      .map((m) => ({
        user_id: "local-user",
        type: m.type,
        memory: m.memory,
        importance: m.importance || 1,
        emotional_weight: m.emotionalWeight || m.emotional_weight || 1,
        repeat_count: m.repeatCount || m.repeat_count || 1,
        relationship_impact: m.relationshipImpact || m.relationship_impact || 1,
        category: m.category || "other",
        created_at: m.createdAt || m.created_at || new Date().toISOString(),
        last_accessed: m.lastAccessed || m.last_accessed || new Date().toISOString(),
      }));

    if (rows.length === 0) {
      return NextResponse.json({ ok: true, synced: 0 });
    }

    const { error } = await supabase.from("inner_memories").upsert(rows, {
      onConflict: "user_id,type,memory",
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, synced: rows.length });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Sync failed" },
      { status: 500 }
    );
  }
}