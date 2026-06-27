import { getSupabase } from "@/lib/supabase";

export type StoredConversationMessage = {
  role: "user" | "assistant";
  content: string;
  turn_index: number;
};

type SaveTurnParams = {
  participantId: string;
  scenarioIndex: number;
  scenarioType: string;
  condition: string;
  turnCount: number;
  userContent: string;
  assistantText: string;
};

type ConversationSnapshotParams = {
  participantId: string;
  scenarioIndex: number;
  scenarioType: string;
  condition: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  turnCount: number;
};

function toStoredMessages(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  turnCount: number
): StoredConversationMessage[] {
  let userTurn = 0;
  return messages.map((message) => {
    if (message.role === "user") {
      userTurn += 1;
      return {
        role: message.role,
        content: message.content,
        turn_index: userTurn,
      };
    }
    return {
      role: message.role,
      content: message.content,
      turn_index: userTurn || turnCount,
    };
  });
}

export async function saveConversationTurn(
  params: SaveTurnParams
): Promise<string | null> {
  const supabase = getSupabase();
  const {
    participantId,
    scenarioIndex,
    scenarioType,
    condition,
    turnCount,
    userContent,
    assistantText,
  } = params;

  const turnMessages: StoredConversationMessage[] = [
    { role: "user", content: userContent, turn_index: turnCount },
    { role: "assistant", content: assistantText, turn_index: turnCount },
  ];

  const { data: existing, error: fetchError } = await supabase
    .from("conversations")
    .select("id, messages")
    .eq("participant_id", participantId)
    .eq("scenario_index", scenarioIndex)
    .maybeSingle();

  if (fetchError) {
    return fetchError.message;
  }

  const prior = (existing?.messages as StoredConversationMessage[] | null) ?? [];
  const messages = [...prior, ...turnMessages];
  const updatedAt = new Date().toISOString();

  if (existing?.id) {
    const { error } = await supabase
      .from("conversations")
      .update({
        messages,
        turn_count: turnCount,
        condition,
        updated_at: updatedAt,
      })
      .eq("id", existing.id);

    return error?.message ?? null;
  }

  const { error } = await supabase.from("conversations").insert({
    participant_id: participantId,
    scenario_index: scenarioIndex,
    scenario_type: scenarioType,
    condition,
    messages,
    turn_count: turnCount,
    updated_at: updatedAt,
  });

  return error?.message ?? null;
}

export async function upsertConversationSnapshot(
  params: ConversationSnapshotParams
): Promise<string | null> {
  const supabase = getSupabase();
  const {
    participantId,
    scenarioIndex,
    scenarioType,
    condition,
    messages,
    turnCount,
  } = params;

  const storedMessages = toStoredMessages(messages, turnCount);
  const updatedAt = new Date().toISOString();

  const { data: existing, error: fetchError } = await supabase
    .from("conversations")
    .select("id")
    .eq("participant_id", participantId)
    .eq("scenario_index", scenarioIndex)
    .maybeSingle();

  if (fetchError) {
    return fetchError.message;
  }

  if (existing?.id) {
    const { error } = await supabase
      .from("conversations")
      .update({
        messages: storedMessages,
        turn_count: turnCount,
        condition,
        scenario_type: scenarioType,
        updated_at: updatedAt,
      })
      .eq("id", existing.id);

    return error?.message ?? null;
  }

  const { error } = await supabase.from("conversations").insert({
    participant_id: participantId,
    scenario_index: scenarioIndex,
    scenario_type: scenarioType,
    condition,
    messages: storedMessages,
    turn_count: turnCount,
    updated_at: updatedAt,
  });

  return error?.message ?? null;
}
