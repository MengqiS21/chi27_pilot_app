import type {
  ChatMessage,
  Condition,
  PilotGroup,
  ScenarioType,
  Stage,
} from "@/lib/types";

export type SessionRestorePayload = {
  participantId: string;
  stage: Stage;
  scenarioIndex: number;
  scenarioOrder: ScenarioType[];
  experiencedScenarioIndex: number;
  interactionScenario: ScenarioType | null;
  pilotGroup: PilotGroup | null;
  assignedCondition: Condition | null;
  messages: ChatMessage[];
  turnCount: number;
  refusalDelivered: boolean;
  consentAgreed: boolean;
  screening: Record<string, string> | null;
};
