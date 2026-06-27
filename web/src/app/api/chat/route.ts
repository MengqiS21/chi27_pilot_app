import { NextResponse } from "next/server";
import { getAiResponse } from "@/lib/anthropic";
import { saveConversationTurn } from "@/lib/conversation-store";
import { maxUserTurnsForGroup } from "@/lib/study-config";
import type { ChatMessage, Condition, PilotGroup } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      participantId,
      messages,
      condition,
      pilotGroup,
      scenarioType,
      scenarioIndex,
      turnCount,
      userContent,
    } = body as {
      participantId: string;
      messages: ChatMessage[];
      condition: Condition | null;
      pilotGroup: PilotGroup;
      scenarioType: string;
      scenarioIndex: number;
      turnCount: number;
      userContent: string;
    };

    const pending: ChatMessage[] = [
      ...messages,
      { role: "user", content: userContent },
    ];

    const assistantText = await getAiResponse(pending, {
      pilotGroup,
      condition,
      turnCount,
    });

    if (!assistantText) {
      return NextResponse.json(
        { error: "The AI returned an empty response." },
        { status: 502 }
      );
    }

    const maxTurns = maxUserTurnsForGroup(pilotGroup);
    const conversationEnded = turnCount >= maxTurns;
    const storedCondition = condition ?? "none";

    const dbError = await saveConversationTurn({
      participantId,
      scenarioIndex,
      scenarioType,
      condition: storedCondition,
      turnCount,
      userContent,
      assistantText,
    });
    if (dbError) {
      console.error("Failed to save conversation:", dbError);
      return NextResponse.json(
        { error: `Could not save conversation. ${dbError}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      assistantText,
      refusalDelivered: conversationEnded,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: `Could not get a response from the AI. ${message}` },
      { status: 500 }
    );
  }
}
