import { NextResponse } from "next/server";
import { VALID_CODES } from "@/content/access-codes";
import { getAssignment } from "@/lib/latin-square";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { accessCode } = await request.json();
    const code = String(accessCode ?? "")
      .trim()
      .toUpperCase();

    if (!VALID_CODES.has(code)) {
      return NextResponse.json({ error: "Invalid access code." }, { status: 400 });
    }

    const supabase = getSupabase();
    const { count, error: countError } = await supabase
      .from("participants")
      .select("id", { count: "exact", head: true });

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    const row = (count ?? 0) % 4;
    const assignment = getAssignment(row);

    const { data, error } = await supabase
      .from("participants")
      .insert({
        access_code: code,
        latin_square_row: row,
        scenario_order: assignment.scenarios,
        condition_order: assignment.conditions,
        stage: "consent",
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      participantId: data.id,
      scenarioOrder: assignment.scenarios,
      conditionOrder: assignment.conditions,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
