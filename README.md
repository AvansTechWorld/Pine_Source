# Pine

A minimalist, offline-first workout PWA for one user. Open it, see
today's workout, log your sets, close it. No accounts, no cloud, no
social — everything lives in IndexedDB on your device.

## Stack

React + Vite, Tailwind CSS, Zustand (workout session state), Dexie
(IndexedDB), vite-plugin-pwa (manifest + service worker). Exercise data
is the [Free Exercise DB](https://github.com/yuhonas/free-exercise-db),
bundled locally at `public/data/exercises.json` and seeded into
IndexedDB on first launch — after that, Pine never needs the network
for exercise data again. Exercise images are fetched from GitHub raw
and cached by the service worker (stale-while-revalidate) as you
browse them.

## Run locally

```
npm install
npm run dev
```

Open the printed local URL on your phone (same Wi-Fi) or in a desktop
browser's device-emulation mode to see the mobile layout.

## Build

```
npm run build
```

Output goes to `dist/`. `npm run preview` serves that build locally if
you want to test the production bundle (and service worker) before
deploying.

## Deploy to Render

This repo includes `render.yaml` at the root, so Render can pick up the
whole configuration automatically:

1. Push this project to a GitHub repo.
2. In Render, choose **New → Blueprint** and point it at the repo —
   it reads `render.yaml` and creates the static site with the right
   build command (`npm run build`) and publish directory (`dist`)
   automatically.
3. Once deployed, open the Render URL on your phone and use the
   browser's "Add to Home Screen" / install prompt (Pine also shows
   its own small install banner after your second visit).

## How the workout generator works (v1 rule engine)

- Onboarding asks one question — your equipment (Bodyweight /
  Dumbbells / Full gym) — and that's the last setup step, ever.
- A fixed 3-day rotation: Day A (push), Day B (pull), Day C (legs +
  core).
- On each app open, Pine checks your last 7 days of completed
  workouts: trained yesterday → move to the next day in rotation;
  skipped a day or more → suggest whichever muscle group has gone
  longest without training.
- Within a workout, it filters the exercise pool by target muscle and
  your equipment tier, then picks 4–5 exercises (3 sets × 8–12 reps),
  spread across the day's target muscles rather than stacking one.

Edit the rotation, muscle groupings, equipment tiers, or rep/set
targets in `src/lib/planGenerator.js` — nothing else needs to change.

## Project structure

```
src/
  db/db.js              Dexie schema + exercise seeding + settings helpers
  lib/planGenerator.js  Rule-based workout generation
  store/workoutStore.js Zustand store for the active workout session
  components/           PineLogo, BottomNav, BarChart
  pages/                Onboarding, Today, Workout, History, Library
public/
  data/exercises.json   Bundled Free Exercise DB (fetched once, seeded once)
  icons/                App icons (regular + maskable, 192/512)
```

## Non-goals (v1)

No accounts, cloud sync, social features, video, AI/ML recommendations,
nutrition tracking, wearable integration, or theming. See the original
brief for the full list — this build follows it exactly.
