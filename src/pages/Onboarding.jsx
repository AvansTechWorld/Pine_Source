import React from "react";
import PineLogo from "../components/PineLogo";

const OPTIONS = [
  { key: "bodyweight", label: "Bodyweight" },
  { key: "dumbbells", label: "Dumbbells" },
  { key: "full gym", label: "Full gym" }
];

export default function Onboarding({ onDone }) {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 gap-10">
      <PineLogo className="w-12 h-12 text-ink" />
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">What equipment do you have?</h1>
        <p className="text-muted text-base">This is the only question Pine will ever ask.</p>
      </div>
      <div className="w-full max-w-sm flex flex-col gap-3">
        {OPTIONS.map((opt) => (
          <button
            key={opt.key}
            aria-label={"Select " + opt.label}
            className="w-full min-h-[56px] rounded-xl bg-surface text-ink text-lg font-semibold active:bg-accent active:text-bg transition-none"
            onClick={() => onDone(opt.key)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
