import { NextResponse } from "next/server";
import { assignPilot } from "@/lib/assignment";
import {
  PILOT_ALLOCATION_SIZE,
  getPilotAllocationSlot,
} from "@/lib/pilot-allocation";
import { PILOT_ALLOCATION_SEED } from "@/lib/study-config";
import { getSupabase } from "@/lib/supabase";
import type { Condition, PilotGroup, ScenarioType } from "@/lib/types";

type ParticipantRow = {
  id: string;
  study: string;
  pilot_group: PilotGroup | null;
  assigned_condition: Condition | null;
  condition_label: string | null;
  scenario_order: ScenarioType[] | null;
  experienced_scenario_index: number | null;
  interaction_scenario: ScenarioType | null;
  latin_square_row: number | null;
};

function assignmentResponse(row: ParticipantRow) {
  return {
    scenarioOrder: row.scenario_order ?? [],
    experiencedScenarioIndex: row.experienced_scenario_index ?? 0,
    interactionScenario: row.interaction_scenario ?? null,
    pilotGroup: row.pilot_group ?? null,
    assignedCondition: row.assigned_condition,
    conditionLabel: row.condition_label ?? null,
    allocationSlotIndex: row.latin_square_row ?? null,
  };
}

const MAX_CLAIM_ATTEMPTS = 8;

async function findFirstOpenPilotSlot(
  supabase: ReturnType<typeof getSupabase>
): Promise<number | null> {
  const { data: takenRows, error } = await supabase
    .from("participants")
    .select("latin_square_row")
    .eq("study", "pilot")
    .not("pilot_group", "is", null)
    .not("latin_square_row", "is", null);

  if (error) {
    throw error;
  }

  const taken = new Set(
    (takenRows ?? [])
      .map((row) => row.latin_square_row)
      .filter((value): value is number => typeof value === "number")
  );

  for (let slotIndex = 0; slotIndex < PILOT_ALLOCATION_SIZE; slotIndex++) {
    if (!taken.has(slotIndex)) {
      return slotIndex;
    }
  }

  return null;
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
        "id, study, pilot_group, assigned_condition, condition_label, scenario_order, experienced_scenario_index, interaction_scenario, latin_square_row"
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

    if (existing.pilot_group) {
      return NextResponse.json(assignmentResponse(existing as ParticipantRow));
    }

    for (let attempt = 0; attempt < MAX_CLAIM_ATTEMPTS; attempt++) {
      let slotIndex: number;
      try {
        const openSlot = await findFirstOpenPilotSlot(supabase);
        if (openSlot === null) {
          return NextResponse.json(
            {
              error:
                "This study has reached its participant capacity. Thank you for your interest.",
            },
            { status: 403 }
          );
        }
        slotIndex = openSlot;
      } catch (slotLookupError) {
        const message =
          slotLookupError instanceof Error
            ? slotLookupError.message
            : "Could not look up allocation slots.";
        return NextResponse.json({ error: message }, { status: 500 });
      }

      const allocationSlot = getPilotAllocationSlot(
        slotIndex,
        PILOT_ALLOCATION_SEED
      );

      if (!allocationSlot) {
        return NextResponse.json(
          { error: "No allocation slot available." },
          { status: 403 }
        );
      }

      const assignment = assignPilot(slotIndex, allocationSlot);

      const { data: updated, error: updateError } = await supabase
        .from("participants")
        .update({
          pilot_group: assignment.pilotGroup,
          scenario_order: assignment.scenarioOrder,
          experienced_scenario_index: assignment.experiencedScenarioIndex,
          interaction_scenario: assignment.interactionScenario,
          assigned_condition: assignment.assignedCondition,
          condition_label: assignment.conditionLabel,
          condition_order: assignment.conditionOrder,
          latin_square_row: slotIndex,
        })
        .eq("id", participantId)
        .is("pilot_group", null)
        .select(
          "id, study, pilot_group, assigned_condition, condition_label, scenario_order, experienced_scenario_index, interaction_scenario, latin_square_row"
        )
        .maybeSingle();

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      if (updated) {
        return NextResponse.json(assignmentResponse(updated as ParticipantRow));
      }

      const { data: retry, error: retryError } = await supabase
        .from("participants")
        .select(
          "id, study, pilot_group, assigned_condition, condition_label, scenario_order, experienced_scenario_index, interaction_scenario, latin_square_row"
        )
        .eq("id", participantId)
        .maybeSingle();

      if (retryError) {
        return NextResponse.json({ error: retryError.message }, { status: 500 });
      }

      if (retry?.pilot_group) {
        return NextResponse.json(assignmentResponse(retry as ParticipantRow));
      }
    }

    return NextResponse.json(
      { error: "Could not assign a participant slot. Please try again." },
      { status: 409 }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
