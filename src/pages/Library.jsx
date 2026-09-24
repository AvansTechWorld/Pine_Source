import React, { useEffect, useMemo, useState } from "react";
import { db } from "../db/db";

export default function Library() {
  const [exercises, setExercises] = useState([]);
  const [muscleFilter, setMuscleFilter] = useState("all");
  const [equipmentFilter, setEquipmentFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    db.exercises.toArray().then(setExercises);
  }, []);

  const muscles = useMemo(
    () => ["all", ...new Set(exercises.flatMap((e) => e.primaryMuscles || []))].sort(),
    [exercises]
  );
  const equipmentOptions = useMemo(
    () => ["all", ...new Set(exercises.map((e) => e.equipment).filter(Boolean))].sort(),
    [exercises]
  );

  const filtered = exercises.filter((e) => {
    const muscleOk = muscleFilter === "all" || (e.primaryMuscles || []).includes(muscleFilter);
    const equipOk = equipmentFilter === "all" || e.equipment === equipmentFilter;
    return muscleOk && equipOk;
  });

  if (selected) {
    return <ExerciseDetail exercise={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="px-5 pt-6 pb-24">
      <h1 className="text-2xl font-bold mb-4">Library</h1>

      <div className="flex gap-3 mb-4">
        <select
          aria-label="Filter by muscle group"
          className="flex-1 min-h-[44px] rounded-lg bg-surface text-ink px-3 capitalize"
          value={muscleFilter}
          onChange={(e) => setMuscleFilter(e.target.value)}
        >
          {muscles.map((m) => (
            <option key={m} value={m}>{m === "all" ? "All muscles" : m}</option>
          ))}
        </select>
        <select
          aria-label="Filter by equipment"
          className="flex-1 min-h-[44px] rounded-lg bg-surface text-ink px-3 capitalize"
          value={equipmentFilter}
          onChange={(e) => setEquipmentFilter(e.target.value)}
        >
          {equipmentOptions.map((eq) => (
            <option key={eq} value={eq}>{eq === "all" ? "All equipment" : eq}</option>
          ))}
        </select>
      </div>

      <p className="text-sm text-muted mb-3">{filtered.length} exercises</p>

      <ul>
        {filtered.map((e) => (
          <li key={e.id} className="border-t border-white/10 first:border-t-0">
            <button
              className="w-full min-h-[56px] flex items-center justify-between text-left py-3"
              onClick={() => setSelected(e)}
              aria-label={"View " + e.name}
            >
              <span className="text-base text-ink">{e.name}</span>
              <span className="text-sm text-muted capitalize shrink-0 ml-3">{e.primaryMuscles?.[0]}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ExerciseDetail({ exercise, onBack }) {
  const [pr, setPr] = useState(null);

  useEffect(() => {
    db.workoutSets
      .where("exerciseId")
      .equals(exercise.id)
      .toArray()
      .then((sets) => {
        if (!sets.length) return setPr(null);
        const best = sets.reduce((a, b) => ((a.weight || 0) * (a.reps || 0) > (b.weight || 0) * (b.reps || 0) ? a : b));
        setPr(best);
      });
  }, [exercise.id]);

  const image = exercise.images?.[0];

  return (
    <div className="px-5 pt-6 pb-24">
      <button aria-label="Back to library" className="text-muted text-base mb-4" onClick={onBack}>← Library</button>

      <h1 className="text-2xl font-bold mb-1">{exercise.name}</h1>
      <p className="text-muted text-base capitalize mb-4">
        {[exercise.primaryMuscles?.[0], exercise.equipment].filter(Boolean).join(" · ")}
      </p>

      {image && (
        <div className="w-full aspect-video bg-surface rounded-xl overflow-hidden mb-4">
          <img src={image} alt={exercise.name} className="w-full h-full object-cover" loading="lazy" />
        </div>
      )}

      {pr && (
        <div className="bg-surface rounded-xl px-4 py-3 mb-4">
          <span className="text-sm text-muted">Personal record</span>
          <div className="text-lg font-bold text-accent">{pr.weight} × {pr.reps}</div>
        </div>
      )}

      {exercise.instructions?.length > 0 && (
        <ol className="list-decimal pl-5 space-y-2">
          {exercise.instructions.map((step, i) => (
            <li key={i} className="text-base text-ink">{step}</li>
          ))}
        </ol>
      )}
    </div>
  );
}
