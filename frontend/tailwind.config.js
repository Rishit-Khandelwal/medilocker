/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        bg:         "rgb(var(--color-bg) / <alpha-value>)",
        surface:    "rgb(var(--color-surface) / <alpha-value>)",
        border:     "rgb(var(--color-border) / <alpha-value>)",
        foreground: "rgb(var(--color-text) / <alpha-value>)",
        muted:      "rgb(var(--color-text-muted) / <alpha-value>)",
        accent:     "rgb(var(--color-accent) / <alpha-value>)",
        success:    "rgb(var(--color-success) / <alpha-value>)",
        danger:     "rgb(var(--color-danger) / <alpha-value>)",
        warning:    "rgb(var(--color-warning) / <alpha-value>)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
      },
    },
  },
  plugins: [],
};