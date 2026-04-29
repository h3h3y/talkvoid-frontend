/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "dark-bg": "#1A1F2E",
        "card-bg": "#4B4038",
        "soft-brown": "#9A8678",
        "soft-beige": "#CAAA98",
        "text-light": "#D4CDC5",
        "text-dim": "#8B7F74",
      },
    },
  },
  plugins: [],
};
