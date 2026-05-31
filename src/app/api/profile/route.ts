import { NextResponse } from "next/server";
import { buildUserProfileV2 } from "@/lib/userProfileEngine";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { memories = [] } = await req.json();

    const { data: dbMemories, error } = await supabase
      .from("inner_memories")
      .select("*")
      .eq("user_id", "local-user")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      return NextResponse.json({ profile: buildUserProfileV2(memories) });
    }

    return NextResponse.json({
      profile: buildUserProfileV2([...(dbMemories ?? []), ...memories]),
    });
  } catch {
    return NextResponse.json({ profile: buildUserProfileV2([]) });
  }
}