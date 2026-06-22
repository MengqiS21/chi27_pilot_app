import type { PilotAllocationSlot } from "@/lib/pilot-allocation";
import { LABEL_TO_CONDITION } from "@/lib/study-config";
import type { Condition, ScenarioType } from "./types";

export const PILOT_SCENARIO_TYPES: ScenarioType[] = [
  "scenario_1",
  "scenario_2",
  "scenario_3",
];

export const PHASE1_SCENARIO_TYPES: ScenarioType[] = [
  "scenario_1",
  "scenario_2",
  "scenario_3",
  "grief",
];

const CONDITIONS: Condition[] = ["A", "B", "C", "D"];

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function assignPilot(
  enrolledCount: number,
  allocationSlot: PilotAllocationSlot
) {
  const interactionScenario = PILOT_SCENARIO_TYPES[enrolledCount % 3];
  const scenarioOrder = shuffle(PILOT_SCENARIO_TYPES);
  const experiencedScenarioIndex = scenarioOrder.indexOf(interactionScenario);

  const assignedCondition: Condition | null = allocationSlot.conditionLabel
    ? LABEL_TO_CONDITION[allocationSlot.conditionLabel]
    : null;

  return {
    study: "pilot" as const,
    pilotGroup: allocationSlot.pilotGroup,
    allocationSlotIndex: enrolledCount,
    scenarioOrder,
    experiencedScenarioIndex,
    interactionScenario,
    assignedCondition,
    conditionLabel: allocationSlot.conditionLabel,
  };
}

export function assignPhase1(count: number) {
  const scenarioIndex = count % PHASE1_SCENARIO_TYPES.length;
  const scenarioType = PHASE1_SCENARIO_TYPES[scenarioIndex];
  const assignedCondition =
    CONDITIONS[Math.floor(count / PHASE1_SCENARIO_TYPES.length) % 4];

  return {
    study: "phase1" as const,
    scenarioOrder: [scenarioType],
    experiencedScenarioIndex: 0,
    assignedCondition,
  };
}
