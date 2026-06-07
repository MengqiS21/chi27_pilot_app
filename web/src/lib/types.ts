export type Stage =
  | "landing"
  | "screening"
  | "screened_out"
  | "consent"
  | "scenario_view"
  | "scenario_chat"
  | "section_a"
  | "section_b"
  | "section_c"
  | "pre_moderators"
  | "post_survey"
  | "demographics"
  | "debrief";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ScenarioType =
  | "scenario_1"
  | "scenario_2"
  | "scenario_3"
  | "grief";
export type Condition = "A" | "B" | "C" | "D";
export type PilotGroup = "group_1" | "group_2";
export type StudyType = "pilot" | "phase1";

export type ExperimentState = {
  stage: Stage;
  participantId: string | null;
  study: StudyType;
  scenarioIndex: number;
  scenarioOrder: ScenarioType[];
  experiencedScenarioIndex: number;
  interactionScenario: ScenarioType | null;
  pilotGroup: PilotGroup | null;
  assignedCondition: Condition | null;
  messages: ChatMessage[];
  turnCount: number;
  refusalDelivered: boolean;
};

export const INITIAL_STATE: ExperimentState = {
  stage: "landing",
  participantId: null,
  study: "pilot",
  scenarioIndex: 0,
  scenarioOrder: [],
  experiencedScenarioIndex: 0,
  interactionScenario: null,
  pilotGroup: null,
  assignedCondition: null,
  messages: [],
  turnCount: 0,
  refusalDelivered: false,
};
