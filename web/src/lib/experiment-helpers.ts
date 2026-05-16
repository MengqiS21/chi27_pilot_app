import type { Condition, ExperimentState, ScenarioType } from "./types";

export function currentScenarioType(state: ExperimentState): ScenarioType {
  return state.scenarioOrder[state.scenarioIndex];
}

export function currentCondition(state: ExperimentState): Condition {
  return state.conditionOrder[state.scenarioIndex];
}

export function resetScenarioChat(state: ExperimentState): Partial<ExperimentState> {
  return {
    messages: [],
    turnCount: 0,
    refusalDelivered: false,
  };
}
