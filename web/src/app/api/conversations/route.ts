import { NextResponse } from "next/server";
import { upsertConversationSnapshot } from "@/lib/conversation-store";
import type { ChatMessage, Condition } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      participantId,
      scenarioIndex,
      scenarioType,
      condition,
      messages,
      turnCount,
    } = body as {
      participantId: string;
      scenarioIndex: number;
      scenarioType: string;
      condition: Condition | null;
      messages: ChatMessage[];
      turnCount: number;
    };

    if (
      !participantId ||
      typeof scenarioIndex !== "number" ||
      !scenarioType ||
      !Array.isArray(messages) ||
      typeof turnCount !== "number"
    ) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const dbError = await upsertConversationSnapshot({
      participantId,
      scenarioIndex,
      scenarioType,
      condition: condition ?? "none",
      messages,
      turnCount,
    });

    if (dbError) {
      return NextResponse.json(
        { error: `Could not save conversation. ${dbError}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
