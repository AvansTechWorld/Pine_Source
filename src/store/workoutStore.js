import { create } from "zustand";
import { db } from "../db/db";

const todayISO = () => new Date().toISOString().slice(0, 10);

export const useWorkoutStore = create((set, get) => ({
  isActive: false,
  plan: null,
  exerciseIndex: 0,
  restDuration: 90,
  restRemaining: 0,
  restRunning: false,
  lastPR: null, // { exerciseId } set briefly after a PR, cleared by the UI

  startWorkout(plan, restDuration = 90) {
    set({ isActive: true, plan, exerciseIndex: 0, restDuration, restRemaining: 0, restRunning: false, lastPR: null });
  },

  currentExercise() {
    const { plan, exerciseIndex } = get();
    return plan ? plan.exercises[exerciseIndex] : null;
  },

  /**
   * Log a set for the current exercise. Saves to IndexedDB immediately —
   * there is no separate "save" step anywhere in the app. Returns whether
   * this set set a new PR (weight × reps beats every previous set logged
   * for this exercise).
   */
  async logSet(weight, reps, rpe) {
    const exercise = get().currentExercise();
    if (!exercise) return { isPR: false };

    const w = Number(weight) || 0;
    const r = Number(reps) || 0;
    const volume = w * r;

    const priorSets = await db.workoutSets.where("exerciseId").equals(exercise.exerciseId).toArray();
    const priorBest = priorSets.reduce((max, s) => Math.max(max, (s.weight || 0) * (s.reps || 0)), 0);
    const isPR = priorSets.length > 0 && volume > priorBest;

    await db.workoutSets.add({
      exerciseId: exercise.exerciseId,
      date: todayISO(),
      weight: w,
      reps: r,
      rpe: rpe != null ? Number(rpe) : null,
      timestamp: Date.now()
    });

    const restDuration = get().restDuration;
    set({ restRemaining: restDuration, restRunning: true, lastPR: isPR ? { exerciseId: exercise.exerciseId } : null });
    return { isPR };
  },

  tickRest() {
    const { restRemaining, restRunning } = get();
    if (!restRunning) return;
    if (restRemaining <= 1) {
      set({ restRemaining: 0, restRunning: false });
    } else {
      set({ restRemaining: restRemaining - 1 });
    }
  },

  addRestTime(seconds) {
    set({ restRemaining: Math.max(0, get().restRemaining + seconds) });
  },

  skipRest() {
    set({ restRemaining: 0, restRunning: false });
  },

  nextExercise() {
    const { plan, exerciseIndex } = get();
    if (!plan) return;
    const nextIndex = Math.min(plan.exercises.length - 1, exerciseIndex + 1);
    set({ exerciseIndex: nextIndex, restRemaining: 0, restRunning: false, lastPR: null });
  },

  prevExercise() {
    const { exerciseIndex } = get();
    set({ exerciseIndex: Math.max(0, exerciseIndex - 1), restRemaining: 0, restRunning: false, lastPR: null });
  },

  isLastExercise() {
    const { plan, exerciseIndex } = get();
    return plan ? exerciseIndex === plan.exercises.length - 1 : true;
  },

  async finishWorkout() {
    const { plan } = get();
    if (plan?.id) await db.workoutPlans.update(plan.id, { completed: true });
    set({ isActive: false, plan: null, exerciseIndex: 0, restRemaining: 0, restRunning: false, lastPR: null });
  },

  /** Quit mid-workout. Every set up to this point is already saved. */
  exitWorkout() {
    set({ isActive: false, plan: null, exerciseIndex: 0, restRemaining: 0, restRunning: false, lastPR: null });
  }
}));
