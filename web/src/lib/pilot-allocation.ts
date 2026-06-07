import type { PilotGroup } from "./types";

export type ConditionLabel =
  | "baseline"
  | "attitude"
  | "subjective_norms"
  | "pbc";

export type PilotAllocationSlot = {
  pilotGroup: PilotGroup;
  conditionLabel: ConditionLabel | null;
};

export const PILOT_ALLOCATION_SIZE = 20;

/** Mulberry32 — deterministic PRNG for seeded Fisher–Yates shuffle. */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const copy = [...items];
  const random = mulberry32(seed);
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildUnshuffledSlots(): PilotAllocationSlot[] {
  const slots: PilotAllocationSlot[] = [];

  for (let i = 0; i < 10; i++) {
    slots.push({ pilotGroup: "group_1", conditionLabel: null });
  }
  for (let i = 0; i < 3; i++) {
    slots.push({ pilotGroup: "group_2", conditionLabel: "baseline" });
  }
  for (let i = 0; i < 3; i++) {
    slots.push({ pilotGroup: "group_2", conditionLabel: "attitude" });
  }
  for (let i = 0; i < 2; i++) {
    slots.push({ pilotGroup: "group_2", conditionLabel: "subjective_norms" });
  }
  for (let i = 0; i < 2; i++) {
    slots.push({ pilotGroup: "group_2", conditionLabel: "pbc" });
  }

  return slots;
}

export function buildPilotAllocationTable(
  seed: number
): PilotAllocationSlot[] {
  return seededShuffle(buildUnshuffledSlots(), seed >>> 0);
}

let cachedSeed: number | null = null;
let cachedTable: PilotAllocationSlot[] | null = null;

export function getPilotAllocationTable(seed: number): PilotAllocationSlot[] {
  const normalized = seed >>> 0;
  if (cachedTable && cachedSeed === normalized) {
    return cachedTable;
  }
  cachedTable = buildPilotAllocationTable(normalized);
  cachedSeed = normalized;
  return cachedTable;
}

export function getPilotAllocationSlot(
  slotIndex: number,
  seed: number
): PilotAllocationSlot | null {
  if (slotIndex < 0 || slotIndex >= PILOT_ALLOCATION_SIZE) {
    return null;
  }
  return getPilotAllocationTable(seed)[slotIndex];
}

/** Summarise quotas — useful for acceptance checks. */
export function summarizePilotAllocation(table: PilotAllocationSlot[]) {
  const summary = {
    group_1: 0,
    group_2: 0,
    baseline: 0,
    attitude: 0,
    subjective_norms: 0,
    pbc: 0,
  };

  for (const slot of table) {
    if (slot.pilotGroup === "group_1") summary.group_1 += 1;
    if (slot.pilotGroup === "group_2") summary.group_2 += 1;
    if (slot.conditionLabel) summary[slot.conditionLabel] += 1;
  }

  return summary;
}
