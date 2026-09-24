import React, { useEffect, useState } from "react";
import { db, getSetting } from "../db/db";
import { getOrCreateTodaysPlan, DAY_TYPES } from "../lib/planGenerator";
import { useWorkoutStore } from "../store/workoutStore";
import PineLogo from "../components/PineLogo";
import BarChart from "../components/BarChart";

export default function Today({ equipment }) {
  const [plan, setPlan] = useState(null);
  const [streak, setStreak] = useState(0);
  const [weekVolume, setWeekVolume] = useState([]);
  const startWorkout = useWorkoutStore((s) => s.startWorkout);

  useEffect(() => {
    (async () => {
      const p = await getOrCreateTodaysPlan(equipment);
      setPlan(p);
      setStreak(await computeStreak());
      setWeekVolume(await computeWeekVolume());
    })();
  }, [equipment]);

  async function handleStart() {
    const restDuration = await getSetting("restTimerDuration", 90);
    startWorkout(plan, restDuration);
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <PineLogo className="w-8 h-8 text-ink opacity-50" />
      </div>
    );
  }

  const dayLabel = DAY_TYPES[plan.dayType]?.label || plan.dayType;

  return (
    <div className="px-5 pt-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <PineLogo className="w-6 h-6 text-ink" />
          <span className="text-lg font-bold">Pine</span>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-accent leading-none">{streak}</div>
          <div className="text-xs text-muted leading-none">day streak</div>
        </div>
      </div>

      <h1 className="text-2xl font-bold mb-1">Day {plan.dayType} — {dayLabel}</h1>
      <p className="text-muted text-base mb-6">{plan.exercises.length} exercises · 3 sets each</p>

      <ul className="mb-8">
        {plan.exercises.map((ex, i) => (
          <li key={ex.exerciseId} className="flex items-center justify-between py-3 border-t border-white/10 first:border-t-0">
            <span className="text-base text-ink">{ex.name}</span>
            <span className="text-sm text-muted shrink-0 ml-3">{ex.targetSets} × {ex.targetReps}</span>
          </li>
        ))}
      </ul>

      {weekVolume.some((d) => d.value > 0) && (
        <div className="mb-24">
          <h2 className="text-sm text-muted mb-2">This week's volume</h2>
          <BarChart data={weekVolume} ariaLabel="This week's training volume by day" />
        </div>
      )}

      <div className="fixed bottom-16 left-0 right-0 px-5 pb-3 bg-bg">
        <button
          aria-label="Start Workout"
          className="w-full min-h-[56px] rounded-xl bg-accent text-bg text-lg font-bold"
          onClick={handleStart}
        >
          Start Workout
        </button>
      </div>
    </div>
  );
}

async function computeStreak() {
  const plans = await db.workoutPlans.where("completed").equals(true).toArray();
  const dates = new Set(plans.map((p) => p.date));
  let streak = 0;
  const cursor = new Date();
  while (true) {
    const iso = cursor.toISOString().slice(0, 10);
    if (dates.has(iso)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else break;
  }
  return streak;
}

async function computeWeekVolume() {
  const days = [];
  const cursor = new Date();
  cursor.setDate(cursor.getDate() - 6);
  for (let i = 0; i < 7; i++) {
    const iso = cursor.toISOString().slice(0, 10);
    days.push({ iso, label: iso.slice(5), value: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  const since = days[0].iso;
  const sets = await db.workoutSets.where("date").aboveOrEqual(since).toArray();
  const byDate = {};
  sets.forEach((s) => {
    byDate[s.date] = (byDate[s.date] || 0) + (s.weight || 0) * (s.reps || 0);
  });
  return days.map((d) => ({ label: d.label, value: byDate[d.iso] || 0 }));
}
