import { NextResponse } from "next/server";
import { assignPilot } from "@/lib/assignment";
import { getSupabase } from "@/lib/supabase";
import type { Condition, ScenarioType } from "@/lib/types";

type ParticipantRow = {
  id: string;
  study: string;
  assigned_condition: Condition | null;
  scenario_order: ScenarioType[] | null;
  experienced_scenario_index: number | null;
};

function assignmentResponse(row: ParticipantRow) {
  return {
    scenarioOrder: row.scenario_order ?? [],
    experiencedScenarioIndex: row.experienced_scenario_index ?? 0,
    assignedCondition: row.assigned_condition as Condition,
  };
}

export async function POST(request: Request) {
  try {
    const { participantId } = await request.json();
    if (!participantId) {
      return NextResponse.json({ error: "Missing participantId" }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data: existing, error: fetchError } = await supabase
      .from("participants")
      .select(
        "id, study, assigned_condition, scenario_order, experienced_scenario_index"
      )
      .eq("id", participantId)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Participant not found." }, { status: 404 });
    }

    if (existing.study !== "pilot") {
      return NextResponse.json(
        { error: "Assignment is only used for the pilot study." },
        { status: 400 }
      );
    }

    if (existing.assigned_condition) {
      return NextResponse.json(assignmentResponse(existing as ParticipantRow));
    }

    const { count, error: countError } = await supabase
      .from("participants")
      .select("id", { count: "exact", head: true })
      .eq("study", "pilot")
      .not("assigned_condition", "is", null);

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    const assignment = assignPilot(count ?? 0);

    const { data: updated, error: updateError } = await supabase
      .from("participants")
      .update({
        scenario_order: assignment.scenarioOrder,
        experienced_scenario_index: assignment.experiencedScenarioIndex,
        assigned_condition: assignment.assignedCondition,
        condition_order: assignment.conditionOrder,
        latin_square_row: (count ?? 0) % 4,
      })
      .eq("id", participantId)
      .is("assigned_condition", null)
      .select(
        "id, study, assigned_condition, scenario_order, experienced_scenario_index"
      )
      .single();

    if (updateError) {
      // Another request may have assigned first (e.g. double submit)
      const { data: retry } = await supabase
        .from("participants")
        .select(
          "id, study, assigned_condition, scenario_order, experienced_scenario_index"
        )
        .eq("id", participantId)
        .single();

      if (retry?.assigned_condition) {
        return NextResponse.json(assignmentResponse(retry as ParticipantRow));
      }

      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json(assignmentResponse(updated as ParticipantRow));
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
