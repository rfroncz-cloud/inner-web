import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("inner_relationship_history")
    .select(
      "id,trust_level,closeness_level,attachment_level,relationship_stage,emotional_trend,recurring_themes,interaction_count,snapshot_reason,created_at"
    )
    .eq("user_id", "local-user")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ history: data ?? [] });
}
