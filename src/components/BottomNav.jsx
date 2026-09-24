import React from "react";

const TABS = [
  { key: "today", label: "Today" },
  { key: "history", label: "History" },
  { key: "library", label: "Library" }
];

export default function BottomNav({ active, onChange }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 flex bg-surface border-t border-white/10"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {TABS.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            aria-label={tab.label}
            aria-current={isActive ? "page" : undefined}
            className={
              "flex-1 min-h-[56px] flex items-center justify-center text-base font-medium " +
              (isActive ? "text-accent" : "text-muted")
            }
            onClick={() => onChange(tab.key)}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
