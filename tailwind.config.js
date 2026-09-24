/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "#0A0A0A",
        surface: "#141414",
        ink: "#F5F5F5",
        muted: "#888888",
        accent: "#22C55E"
      },
      fontSize: {
        timer: ["48px", { lineHeight: "1" }]
      }
    }
  },
  plugins: []
};
