import React, { useEffect, useRef, useState } from "react";
import { db } from "../db/db";
import { useWorkoutStore } from "../store/workoutStore";

export default function Workout() {
  const plan = useWorkoutStore((s) => s.plan);
  const exerciseIndex = useWorkoutStore((s) => s.exerciseIndex);
  const restRemaining = useWorkoutStore((s) => s.restRemaining);
  const restRunning = useWorkoutStore((s) => s.restRunning);
  const lastPR = useWorkoutStore((s) => s.lastPR);
  const logSet = useWorkoutStore((s) => s.logSet);
  const tickRest = useWorkoutStore((s) => s.tickRest);
  const addRestTime = useWorkoutStore((s) => s.addRestTime);
  const skipRest = useWorkoutStore((s) => s.skipRest);
  const nextExercise = useWorkoutStore((s) => s.nextExercise);
  const prevExercise = useWorkoutStore((s) => s.prevExercise);
  const isLastExercise = useWorkoutStore((s) => s.isLastExercise);
  const finishWorkout = useWorkoutStore((s) => s.finishWorkout);
  const exitWorkout = useWorkoutStore((s) => s.exitWorkout);

  const exercise = plan?.exercises[exerciseIndex];
  const [detail, setDetail] = useState(null);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [setsLoggedThisExercise, setSetsLoggedThisExercise] = useState(0);
  const [showPR, setShowPR] = useState(false);

  const touchStartX = useRef(null);

  // Load full exercise detail (image, instructions) and reset per-exercise state.
  useEffect(() => {
    setSetsLoggedThisExercise(0);
    setShowPR(false);
    if (!exercise) return;
    db.exercises.get(exercise.exerciseId).then((full) => {
      setDetail(full || null);
      // Prefill with the most recent logged weight/reps for this exercise, if any.
      db.workoutSets
        .where("exerciseId")
        .equals(exercise.exerciseId)
        .toArray()
        .then((sets) => {
          if (sets.length) {
            const last = sets.sort((a, b) => b.timestamp - a.timestamp)[0];
            setWeight(String(last.weight ?? ""));
            setReps(String(last.reps ?? ""));
          } else {
            setWeight("");
            setReps("");
          }
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise?.exerciseId]);

  // Rest timer ticks once per second while running.
  useEffect(() => {
    if (!restRunning) return;
    const id = setInterval(tickRest, 1000);
    return () => clearInterval(id);
  }, [restRunning, tickRest]);

  if (!plan || !exercise) return null;

  const restFinished = !restRunning && setsLoggedThisExercise > 0;

  async function handleDoneSet() {
    const { isPR } = await logSet(weight, reps);
    setSetsLoggedThisExercise((n) => n + 1);
    if (isPR) {
      setShowPR(true);
      setTimeout(() => setShowPR(false), 2500);
    }
  }

  function handleNext() {
    if (isLastExercise()) {
      finishWorkout();
    } else {
      nextExercise();
    }
  }

  function handleExit() {
    if (window.confirm("Stop the workout? Everything logged so far is already saved.")) {
      exitWorkout();
    }
  }

  function onTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e) {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 50) return;
    if (dx < 0) nextExercise();
    else prevExercise();
  }

  const cue = detail?.instructions?.[0] || null;
  const image = detail?.images?.[0] || null;
  const primaryMuscle = exercise.primaryMuscles?.[0] || "";

  return (
    <div
      className="min-h-screen bg-bg flex flex-col px-5 pt-6 pb-8"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="flex items-center justify-between mb-4">
        <button aria-label="Exit workout" className="text-muted text-2xl leading-none px-2" onClick={handleExit}>
          ✕
        </button>
        <span className="text-sm text-muted">
          {exerciseIndex + 1} / {plan.exercises.length}
        </span>
      </div>

      <div className="mb-1">
        <h1 className="text-2xl font-bold">{exercise.name}</h1>
        {primaryMuscle && <p className="text-muted text-base capitalize">{primaryMuscle}</p>}
      </div>

      {image && (
        <div className="w-full aspect-video bg-surface rounded-xl overflow-hidden my-4">
          <img src={image} alt={exercise.name} className="w-full h-full object-cover" loading="lazy" />
        </div>
      )}

      {cue && <p className="text-ink text-base mb-6">{cue}</p>}

      <div className="mt-auto">
        {showPR && (
          <div className="mb-3 text-center">
            <span className="inline-block bg-accent text-bg font-bold text-sm px-3 py-1 rounded-full">PR!</span>
          </div>
        )}

        {restRunning ? (
          <div className="text-center mb-4">
            <p className="text-muted text-base mb-1">Rest</p>
            <div className="text-timer font-bold tabular-nums">{formatTime(restRemaining)}</div>
            <div className="flex gap-2 justify-center mt-4">
              <button className="min-h-[44px] px-4 rounded-lg bg-surface text-ink" onClick={() => addRestTime(15)}>+15s</button>
              <button className="min-h-[44px] px-4 rounded-lg bg-surface text-ink" onClick={() => addRestTime(30)}>+30s</button>
              <button className="min-h-[44px] px-4 rounded-lg bg-surface text-ink" aria-label="Skip rest" onClick={skipRest}>Skip</button>
            </div>
          </div>
        ) : (
          <div className="flex gap-3 mb-4">
            <label className="flex-1">
              <span className="block text-sm text-muted mb-1">Weight</span>
              <input
                type="number"
                inputMode="decimal"
                aria-label="Weight"
                className="w-full min-h-[56px] rounded-xl bg-surface text-ink text-2xl font-bold text-center"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </label>
            <label className="flex-1">
              <span className="block text-sm text-muted mb-1">Reps</span>
              <input
                type="number"
                inputMode="numeric"
                aria-label="Reps"
                className="w-full min-h-[56px] rounded-xl bg-surface text-ink text-2xl font-bold text-center"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
              />
            </label>
          </div>
        )}

        {!restRunning && (
          <button
            aria-label={restFinished ? (isLastExercise() ? "Finish Workout" : "Next Exercise") : "Done Set"}
            className="w-full min-h-[56px] rounded-xl bg-accent text-bg text-lg font-bold"
            onClick={restFinished ? handleNext : handleDoneSet}
          >
            {restFinished ? (isLastExercise() ? "Finish Workout" : "Next Exercise") : "Done Set"}
          </button>
        )}

        <p className="text-center text-xs text-muted mt-3">
          Set {setsLoggedThisExercise + (restFinished ? 0 : 1)} of {exercise.targetSets} · {exercise.targetReps} reps
        </p>
      </div>
    </div>
  );
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}
