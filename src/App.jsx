import React, { useEffect, useState } from "react";
import { seedExercisesIfNeeded, getSetting, setSetting } from "./db/db";
import { useWorkoutStore } from "./store/workoutStore";
import BottomNav from "./components/BottomNav";
import Onboarding from "./pages/Onboarding";
import Today from "./pages/Today";
import History from "./pages/History";
import Library from "./pages/Library";
import Workout from "./pages/Workout";
import PineLogo from "./components/PineLogo";

export default function App() {
  const [ready, setReady] = useState(false);
  const [equipment, setEquipment] = useState(undefined); // undefined = still loading
  const [tab, setTab] = useState("today");
  const [visitCount, setVisitCount] = useState(0);
  const [installEvent, setInstallEvent] = useState(null);
  const [dismissedInstall, setDismissedInstall] = useState(false);

  const isActive = useWorkoutStore((s) => s.isActive);

  useEffect(() => {
    (async () => {
      await seedExercisesIfNeeded();
      const eq = await getSetting("equipmentType", null);
      setEquipment(eq);

      const visits = (await getSetting("visitCount", 0)) + 1;
      await setSetting("visitCount", visits);
      setVisitCount(visits);

      setReady(true);
    })();

    const onBeforeInstall = (e) => {
      e.preventDefault();
      setInstallEvent(e);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  async function handleOnboardingDone(equipmentKey) {
    await setSetting("equipmentType", equipmentKey);
    setEquipment(equipmentKey);
  }

  if (!ready || equipment === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <PineLogo className="w-10 h-10 text-ink opacity-60" />
      </div>
    );
  }

  if (!equipment) {
    return <Onboarding onDone={handleOnboardingDone} />;
  }

  if (isActive) {
    // Full-screen workout mode: no tabs, no nav, nothing else on screen.
    return <Workout />;
  }

  const showInstallBanner = installEvent && visitCount >= 2 && !dismissedInstall;

  return (
    <div className="min-h-screen bg-bg pb-20">
      {showInstallBanner && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-surface border-b border-white/10 px-4 py-3 flex items-center gap-3">
          <PineLogo className="w-5 h-5 text-ink shrink-0" />
          <p className="text-sm text-ink flex-1">Install Pine for one-tap access, even offline.</p>
          <button
            className="text-sm font-semibold text-accent px-2 py-1"
            aria-label="Install Pine"
            onClick={async () => {
              installEvent.prompt();
              setDismissedInstall(true);
            }}
          >
            Install
          </button>
          <button
            className="text-sm text-muted px-2 py-1"
            aria-label="Dismiss install prompt"
            onClick={() => setDismissedInstall(true)}
          >
            ✕
          </button>
        </div>
      )}

      <div className={showInstallBanner ? "pt-14" : ""}>
        {tab === "today" && <Today equipment={equipment} />}
        {tab === "history" && <History />}
        {tab === "library" && <Library equipment={equipment} />}
      </div>

      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
