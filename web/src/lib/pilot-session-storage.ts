const PILOT_SESSION_KEY = "chi27_pilot_participant_id";

export function readPilotSessionParticipantId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = sessionStorage.getItem(PILOT_SESSION_KEY)?.trim();
    return value || null;
  } catch {
    return null;
  }
}

export function persistPilotSessionParticipantId(participantId: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(PILOT_SESSION_KEY, participantId);
  } catch {
    // Ignore quota / private-mode errors.
  }
}

export function clearPilotSessionParticipantId(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(PILOT_SESSION_KEY);
  } catch {
    // Ignore.
  }
}
