import { maxUserTurnsForGroup } from "@/lib/study-config";
import type { SessionRestorePayload } from "@/lib/session-restore-types";
import { getSupabase } from "@/lib/supabase";
import type {
  ChatMessage,
  Condition,
  PilotGroup,
  ScenarioType,
  Stage,
} from "@/lib/types";

export type { SessionRestorePayload };

type StoredConversationMessage = {
  role: "user" | "assistant";
  content: string;
  turn_index?: number;
};

type ParticipantRow = {
  id: string;
  stage: string | null;
  scenario_order: ScenarioType[] | null;
  experienced_scenario_index: number | null;
  interaction_scenario: ScenarioType | null;
  pilot_group: PilotGroup | null;
  assigned_condition: Condition | null;
};

type SurveyRow = {
  section: string;
  scenario_index: number | null;
  responses: Record<string, unknown>;
};

function isStage(value: string): value is Stage {
  return [
    "landing",
    "screening",
    "screened_out",
    "consent",
    "scenario_view",
    "scenario_chat",
    "section_a",
    "section_b",
    "section_c",
    "pre_moderators",
    "post_survey",
    "demographics",
    "debrief",
  ].includes(value);
}

function resolveStageAndScenarioIndex(
  dbStage: string,
  experiencedScenarioIndex: number,
  sectionAIndices: number[],
  scenarioOrderLength: number
): { stage: Stage; scenarioIndex: number } {
  const stage = isStage(dbStage) ? dbStage : "screening";
  const completed = new Set(sectionAIndices);

  if (stage === "section_a" && scenarioOrderLength > 0) {
    for (let i = 0; i < scenarioOrderLength; i++) {
      if (!completed.has(i)) {
        return { stage, scenarioIndex: i };
      }
    }
    return { stage: "scenario_view", scenarioIndex: experiencedScenarioIndex };
  }

  if (
    stage === "scenario_view" ||
    stage === "scenario_chat" ||
    stage === "section_b" ||
    stage === "section_c"
  ) {
    return { stage, scenarioIndex: experiencedScenarioIndex };
  }

  return { stage, scenarioIndex: 0 };
}

function toChatMessages(messages: StoredConversationMessage[]): ChatMessage[] {
  return messages.map(({ role, content }) => ({ role, content }));
}

export async function buildSessionRestore(
  participantId: string
): Promise<SessionRestorePayload | null> {
  const supabase = getSupabase();

  const { data: participant, error: participantError } = await supabase
    .from("participants")
    .select(
      "id, stage, scenario_order, experienced_scenario_index, interaction_scenario, pilot_group, assigned_condition"
    )
    .eq("id", participantId)
    .eq("study", "pilot")
    .maybeSingle();

  if (participantError || !participant) {
    return null;
  }

  const row = participant as ParticipantRow;
  const scenarioOrder = row.scenario_order ?? [];
  const experiencedScenarioIndex = row.experienced_scenario_index ?? 0;
  const pilotGroup = row.pilot_group ?? null;

  const { data: surveys, error: surveysError } = await supabase
    .from("survey_responses")
    .select("section, scenario_index, responses")
    .eq("participant_id", participantId)
    .order("submitted_at", { ascending: true });

  if (surveysError) {
    return null;
  }

  const surveyRows = (surveys ?? []) as SurveyRow[];
  const sectionAIndices = surveyRows
    .filter((entry) => entry.section === "section_a")
    .map((entry) => entry.scenario_index)
    .filter((index): index is number => typeof index === "number");

  const screeningRow = surveyRows.find((entry) => entry.section === "screening");
  const consentRow = surveyRows.find((entry) => entry.section === "consent");

  const dbStage = row.stage ?? "screening";
  const { stage, scenarioIndex } = resolveStageAndScenarioIndex(
    dbStage,
    experiencedScenarioIndex,
    sectionAIndices,
    scenarioOrder.length
  );

  let messages: ChatMessage[] = [];
  let turnCount = 0;
  let refusalDelivered = false;

  if (stage === "scenario_chat") {
    const chatScenarioIndex = scenarioIndex;

    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .select("messages, turn_count")
      .eq("participant_id", participantId)
      .eq("scenario_index", chatScenarioIndex)
      .maybeSingle();

    if (!conversationError && conversation) {
      const stored =
        (conversation.messages as StoredConversationMessage[] | null) ?? [];
      messages = toChatMessages(stored);
      turnCount =
        typeof conversation.turn_count === "number"
          ? conversation.turn_count
          : Math.ceil(messages.filter((m) => m.role === "user").length);

      if (pilotGroup) {
        refusalDelivered = turnCount >= maxUserTurnsForGroup(pilotGroup);
      }
    }
  }

  const consentAgreed =
    Boolean(consentRow) ||
    !["landing", "screening", "consent", "screened_out"].includes(stage);

  const screening =
    screeningRow?.responses &&
    typeof screeningRow.responses === "object" &&
    !Array.isArray(screeningRow.responses)
      ? (Object.fromEntries(
          Object.entries(screeningRow.responses).map(([key, value]) => [
            key,
            String(value),
          ])
        ) as Record<string, string>)
      : null;

  return {
    participantId: row.id,
    stage,
    scenarioIndex,
    scenarioOrder,
    experiencedScenarioIndex,
    interactionScenario: row.interaction_scenario ?? null,
    pilotGroup,
    assignedCondition: row.assigned_condition ?? null,
    messages,
    turnCount,
    refusalDelivered,
    consentAgreed,
    screening,
  };
}

export async function findPilotParticipantIdByAssignment(
  assignmentId: string
): Promise<string | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("participants")
    .select("id")
    .eq("study", "pilot")
    .eq("cloudresearch_assignment_id", assignmentId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data.id as string;
}
