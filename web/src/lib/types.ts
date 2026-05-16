export type Stage =
  | "landing"
  | "consent"
  | "pre_survey"
  | "scenario_chat"
  | "post_survey"
  | "debrief";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ScenarioType = "temporal" | "relational" | "face" | "grief";
export type Condition = "A" | "B" | "C" | "D";

export type ExperimentState = {
  stage: Stage;
  participantId: string | null;
  scenarioIndex: number;
  scenarioOrder: ScenarioType[];
  conditionOrder: Condition[];
  messages: ChatMessage[];
  turnCount: number;
  refusalDelivered: boolean;
};

export const INITIAL_STATE: ExperimentState = {
  stage: "landing",
  participantId: null,
  scenarioIndex: 0,
  scenarioOrder: [],
  conditionOrder: [],
  messages: [],
  turnCount: 0,
  refusalDelivered: false,
};
