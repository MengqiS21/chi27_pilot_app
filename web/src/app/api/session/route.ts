import { NextResponse } from "next/server";
import {
  buildSessionRestore,
  findPilotParticipantIdByAssignment,
} from "@/lib/session-restore";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get("participantId")?.trim();
    const assignmentId = searchParams.get("assignmentId")?.trim();

    let resolvedParticipantId = participantId ?? null;

    if (!resolvedParticipantId && assignmentId) {
      resolvedParticipantId = await findPilotParticipantIdByAssignment(
        assignmentId
      );
    }

    if (!resolvedParticipantId) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    const session = await buildSessionRestore(resolvedParticipantId);
    if (!session) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
