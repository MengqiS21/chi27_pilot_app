import type { Condition, ScenarioType } from "./types";

const LATIN_SQUARE: { conditions: Condition[]; scenarios: ScenarioType[] }[] = [
  {
    conditions: ["A", "B", "C", "D"],
    scenarios: ["scenario_1", "scenario_2", "scenario_3", "grief"],
  },
  {
    conditions: ["B", "C", "D", "A"],
    scenarios: ["scenario_2", "scenario_3", "grief", "scenario_1"],
  },
  {
    conditions: ["C", "D", "A", "B"],
    scenarios: ["scenario_3", "grief", "scenario_1", "scenario_2"],
  },
  {
    conditions: ["D", "A", "B", "C"],
    scenarios: ["grief", "scenario_1", "scenario_2", "scenario_3"],
  },
];

export function getAssignment(row: number) {
  return LATIN_SQUARE[row % 4];
}
