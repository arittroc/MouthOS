import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#05040f",
          900: "#0a0818",
          800: "#120e26",
        },
        aurora: {
          indigo: "#6366f1",
          violet: "#a855f7",
          cyan: "#22d3ee",
          rose: "#f472b6",
          mint: "#5eead4",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        display: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.36)",
        "glass-lg": "0 24px 80px -12px rgba(0, 0, 0, 0.65)",
        glow: "0 0 0 1px rgba(255,255,255,0.08), 0 0 48px -12px rgba(129,140,248,0.55)",
      },
      animation: {
        drift: "drift 26s ease-in-out infinite",
        "drift-slow": "drift 38s ease-in-out infinite reverse",
        float: "float 9s ease-in-out infinite",
        "fade-up": "fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
        shimmer: "shimmer 2.4s linear infinite",
        "pulse-soft": "pulse-soft 5s ease-in-out infinite",
      },
      keyframes: {
        drift: {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "33%": { transform: "translate3d(4%, -6%, 0) scale(1.08)" },
          "66%": { transform: "translate3d(-5%, 4%, 0) scale(0.96)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "0.9" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
