import Dexie from "dexie";

// All of Pine's storage lives in one IndexedDB database. Nothing here ever
// talks to a server — this file is the entire "backend."
export const db = new Dexie("PineDB");

db.version(1).stores({
  exercises: "id, name, *primaryMuscles, equipment, category",
  workoutSets: "++id, exerciseId, date, timestamp",
  workoutPlans: "++id, date, dayType, completed",
  settings: "key"
});

/**
 * Seed the exercises table from the bundled Free Exercise DB JSON on first
 * load. This runs once — after that the table is populated forever and the
 * app never needs the network for exercise data again.
 */
export async function seedExercisesIfNeeded() {
  const count = await db.exercises.count();
  if (count > 0) return count;

  // import.meta.env.BASE_URL resolves to "/" on a root deploy (e.g. Render) or
  // "/Pine_Source/" on GitHub Pages — either way this always points at the
  // right place instead of assuming the app is hosted at a domain root.
  const res = await fetch(`${import.meta.env.BASE_URL}data/exercises.json`);
  const exercises = await res.json();
  await db.exercises.bulkPut(exercises);
  return exercises.length;
}

/* ---------- settings helpers (simple key/value store) ---------- */

export async function getSetting(key, fallback = null) {
  const row = await db.settings.get(key);
  return row ? row.value : fallback;
}

export async function setSetting(key, value) {
  await db.settings.put({ key, value });
}
