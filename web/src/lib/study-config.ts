export const STUDY = "pilot" as const;

/** Provisional transition trigger T — change here only (or via env). */
export const TRANSITION_TRIGGER_T = Number(
  process.env.NEXT_PUBLIC_TRANSITION_TRIGGER_T ?? "3"
);

export const MAX_USER_TURNS_GROUP_1 = Number(
  process.env.NEXT_PUBLIC_MAX_USER_TURNS_GROUP_1 ?? "8"
);

export const MAX_USER_TURNS_GROUP_2 = Number(
  process.env.NEXT_PUBLIC_MAX_USER_TURNS_GROUP_2 ?? "6"
);

/** Storage labels for Group 2 conditions (A–D map to these). */
export const CONDITION_LABELS = {
  A: "baseline",
  B: "attitude",
  C: "subjective_norms",
  D: "pbc",
} as const;

export type ConditionLabel =
  (typeof CONDITION_LABELS)[keyof typeof CONDITION_LABELS];

export const LABEL_TO_CONDITION = {
  baseline: "A",
  attitude: "B",
  subjective_norms: "C",
  pbc: "D",
} as const satisfies Record<ConditionLabel, keyof typeof CONDITION_LABELS>;

/** Seeded shuffle seed for the 20-slot pilot allocation table. */
export const PILOT_ALLOCATION_SEED = Number(
  process.env.PILOT_ALLOCATION_SEED ??
    process.env.NEXT_PUBLIC_PILOT_ALLOCATION_SEED ??
    "20260529"
);

export function maxUserTurnsForGroup(pilotGroup: "group_1" | "group_2"): number {
  return pilotGroup === "group_1"
    ? MAX_USER_TURNS_GROUP_1
    : MAX_USER_TURNS_GROUP_2;
}
