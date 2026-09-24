import React, { useEffect, useState } from "react";
import { db } from "../db/db";
import BarChart from "../components/BarChart";

export default function History() {
  const [groups, setGroups] = useState([]); // [{ date, plan, expanded, sets: [{name, entries}] }]
  const [muscleVolume, setMuscleVolume] = useState([]);

  useEffect(() => {
    (async () => {
      const plans = await db.workoutPlans.where("completed").equals(true).sortBy("date");
      plans.reverse();

      const built = [];
      for (const plan of plans) {
        const sets = await db.workoutSets.where("date").equals(plan.date).toArray();
        const byExercise = {};
        sets
          .filter((s) => plan.exerciseIds.includes(s.exerciseId))
          .forEach((s) => {
            const name = plan.exercises.find((e) => e.exerciseId === s.exerciseId)?.name || s.exerciseId;
            (byExercise[name] = byExercise[name] || []).push(s);
          });
        built.push({ plan, byExercise, expanded: false });
      }
      setGroups(built);
      setMuscleVolume(await computeMuscleVolume());
    })();
  }, []);

  function toggle(i) {
    setGroups((prev) => prev.map((g, idx) => (idx === i ? { ...g, expanded: !g.expanded } : g)));
  }

  return (
    <div className="px-5 pt-6 pb-24">
      <h1 className="text-2xl font-bold mb-6">History</h1>

      {muscleVolume.some((d) => d.value > 0) && (
        <div className="mb-8">
          <h2 className="text-sm text-muted mb-2">Volume by muscle group — this week</h2>
          <BarChart data={muscleVolume} ariaLabel="This week's volume by muscle group" />
        </div>
      )}

      {groups.length === 0 ? (
        <p className="text-muted text-base">No workouts finished yet. Your history shows up here once you complete one.</p>
      ) : (
        <ul>
          {groups.map((g, i) => (
            <li key={g.plan.id} className="border-t border-white/10 first:border-t-0 py-4">
              <button
                className="w-full flex items-center justify-between text-left"
                aria-expanded={g.expanded}
                onClick={() => toggle(i)}
              >
                <div>
                  <div className="text-base font-semibold text-ink">{formatDate(g.plan.date)}</div>
                  <div className="text-sm text-muted">Day {g.plan.dayType} · {Object.keys(g.byExercise).length} exercises</div>
                </div>
                <span className="text-muted text-lg">{g.expanded ? "−" : "+"}</span>
              </button>
              {g.expanded && (
                <div className="mt-3">
                  {Object.entries(g.byExercise).map(([name, entries]) => (
                    <div key={name} className="py-2">
                      <div className="text-sm font-medium text-ink mb-1">{name}</div>
                      <div className="text-sm text-muted">
                        {entries.map((e, idx) => (
                          <span key={idx}>
                            {e.weight}×{e.reps}
                            {idx < entries.length - 1 ? " · " : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatDate(iso) {
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
}

async function computeMuscleVolume() {
  const since = new Date();
  since.setDate(since.getDate() - 6);
  const sinceISO = since.toISOString().slice(0, 10);

  const sets = await db.workoutSets.where("date").aboveOrEqual(sinceISO).toArray();
  if (sets.length === 0) return [];

  const exerciseIds = [...new Set(sets.map((s) => s.exerciseId))];
  const exercises = await db.exercises.bulkGet(exerciseIds);
  const muscleById = {};
  exercises.forEach((e) => { if (e) muscleById[e.id] = e.primaryMuscles?.[0] || "other"; });

  const totals = {};
  sets.forEach((s) => {
    const muscle = muscleById[s.exerciseId] || "other";
    totals[muscle] = (totals[muscle] || 0) + (s.weight || 0) * (s.reps || 0);
  });

  return Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, value]) => ({ label: label.slice(0, 4), value }));
}
