import React from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "./index.css";

// autoUpdate: the new service worker takes over as soon as it's ready,
// no "update available" prompt needed for a single-user personal app.
registerSW({ immediate: true });

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
