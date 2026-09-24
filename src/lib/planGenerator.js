import { db } from "../db/db";

// Equipment the user picked during onboarding maps to which Free Exercise DB
// "equipment" values are allowed. "body only" is always included since a
// bodyweight exercise never needs anything extra.
export const EQUIPMENT_TIERS = {
  bodyweight: ["body only"],
  dumbbells: ["body only", "dumbbell"],
  "full gym": [
    "body only",
    "dumbbell",
    "barbell",
    "cable",
    "machine",
    "kettlebells",
    "bands",
    "e-z curl bar",
    "medicine ball",
    "exercise ball"
  ]
};

// The 3-day rotation. Each day type maps to the primary muscles it targets.
export const DAY_TYPES = {
  A: { label: "Push", muscles: ["chest", "shoulders", "triceps"] },
  B: { label: "Pull", muscles: ["lats", "middle back", "biceps", "traps", "forearms", "lower back"] },
  C: { label: "Legs + Core", muscles: ["quadriceps", "hamstrings", "glutes", "calves", "adductors", "abductors", "abdominals"] }
};
const ROTATION_ORDER = ["A", "B", "C"];

/** Given the last trained day type, return the next one in the rotation. */
export function nextDayType(lastDayType) {
  if (!lastDayType) return "A";
  const idx = ROTATION_ORDER.indexOf(lastDayType);
  return ROTATION_ORDER[(idx + 1) % ROTATION_ORDER.length];
}

/**
 * Decide which day type to suggest today.
 * - No history at all → start the rotation at Day A.
 * - Trained yesterday → move to the next day in rotation.
 * - Skipped a day or more → suggest whichever muscle group has gone
 *   untouched the longest within the last 7 days.
 */
export async function decideNextDayType() {
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const sinceISO = since.toISOString().slice(0, 10);

  const recentPlans = await db.workoutPlans
    .where("date")
    .aboveOrEqual(sinceISO)
    .and((p) => p.completed)
    .sortBy("date");

  if (recentPlans.length === 0) return "A";

  const last = recentPlans[recentPlans.length - 1];
  const lastDate = new Date(last.date + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysSince = Math.round((today - lastDate) / 86400000);

  if (daysSince <= 1) {
    return nextDayType(last.dayType);
  }

  // Skipped — find the day type with the oldest (or no) completion in the window.
  const lastCompletedByType = { A: null, B: null, C: null };
  recentPlans.forEach((p) => { lastCompletedByType[p.dayType] = p.date; });
  const withNoRecent = ROTATION_ORDER.filter((t) => !lastCompletedByType[t]);
  if (withNoRecent.length) return withNoRecent[0];

  return ROTATION_ORDER.slice().sort(
    (a, b) => lastCompletedByType[a].localeCompare(lastCompletedByType[b])
  )[0];
}

/**
 * Build today's exercise list: filter the exercise pool by target muscles
 * and available equipment, then pick 4–5 exercises, favoring variety across
 * primary muscles within the day type.
 */
export async function generateWorkout(dayType, equipmentKey) {
  const allowedEquipment = EQUIPMENT_TIERS[equipmentKey] || EQUIPMENT_TIERS.bodyweight;
  const { muscles } = DAY_TYPES[dayType];

  const candidates = await db.exercises
    .where("primaryMuscles")
    .anyOf(muscles)
    .toArray();

  const usable = candidates.filter(
    (e) => e.category === "strength" && allowedEquipment.includes(e.equipment)
  );

  // Spread picks across the day's target muscles rather than letting one
  // muscle dominate all 4–5 slots.
  const byMuscle = {};
  muscles.forEach((m) => { byMuscle[m] = shuffle(usable.filter((e) => e.primaryMuscles.includes(m))); });

  const picked = [];
  const targetCount = 5;
  let round = 0;
  while (picked.length < targetCount && round < 10) {
    for (const m of muscles) {
      if (picked.length >= targetCount) break;
      const pool = byMuscle[m];
      const next = pool && pool[round];
      if (next && !picked.find((p) => p.id === next.id)) picked.push(next);
    }
    round++;
  }

  return picked.slice(0, targetCount).map((e) => ({
    exerciseId: e.id,
    name: e.name,
    primaryMuscles: e.primaryMuscles,
    targetSets: 3,
    targetReps: "8–12"
  }));
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Get (or create) today's plan. Persists to IndexedDB so it survives app
 * restarts and works fully offline.
 */
export async function getOrCreateTodaysPlan(equipmentKey) {
  const todayISO = new Date().toISOString().slice(0, 10);
  const existing = await db.workoutPlans.where("date").equals(todayISO).first();
  if (existing) return existing;

  const dayType = await decideNextDayType();
  const exercises = await generateWorkout(dayType, equipmentKey);
  const plan = {
    date: todayISO,
    dayType,
    exerciseIds: exercises.map((e) => e.exerciseId),
    exercises, // denormalized for convenience — cheap since it's local storage
    completed: false
  };
  const id = await db.workoutPlans.add(plan);
  return { ...plan, id };
}
