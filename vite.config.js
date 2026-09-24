import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// GitHub Pages serves this app from a sub-path (https://<user>.github.io/Pine_Source/),
// not the domain root, so every absolute asset/URL reference needs this prefix.
// If you ever move to a host that serves from the root (Render, a custom domain, etc.),
// change this back to "/".
const BASE_PATH = "/Pine_Source/";

export default defineConfig({
  base: BASE_PATH,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/*.png"],
      manifest: {
        name: "Pine",
        short_name: "Pine",
        description: "A minimalist offline-first workout tracker.",
        display: "standalone",
        start_url: BASE_PATH,
        scope: BASE_PATH,
        theme_color: "#0A0A0A",
        background_color: "#0A0A0A",
        icons: [
          { src: "icons/pine-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/pine-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/pine-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "icons/pine-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      },
      workbox: {
        // App shell (HTML/CSS/JS) precached automatically by the plugin (globPatterns default).
        globPatterns: ["**/*.{js,css,html,svg,woff2,png}"],
        navigateFallback: BASE_PATH + "index.html",
        runtimeCaching: [
          {
            // Exercise images hosted on GitHub raw — cache-first with background refresh.
            urlPattern: ({ url }) => url.hostname === "raw.githubusercontent.com",
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "pine-exercise-images",
              expiration: { maxEntries: 1000, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          },
          {
            // Bundled exercise JSON — never changes at runtime, cache-first forever.
            urlPattern: ({ url }) => url.pathname.endsWith("/data/exercises.json"),
            handler: "CacheFirst",
            options: { cacheName: "pine-exercise-data" }
          }
        ]
      }
    })
  ]
});
