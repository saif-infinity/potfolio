import tailwindcssAnimate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Surfaces - SOLID colors only. Gradients live in globals.css, not here,
        // otherwise every `/opacity` modifier (e.g. bg-bg/50) silently breaks.
        bg: "#030509",
        bg2: "#0a1118",
        fg: "#ffffff",
        muted: "#9ca3af",
        primary: {
          DEFAULT: "#00ff41",
          hover: "#5cff7a",
          dim: "#12933d",
        },
        accent: {
          violet: "#4ade80",
          cyan: "#2dd4bf",
        },
        glass: "rgba(255,255,255,0.05)",
        hairline: "rgba(255,255,255,0.10)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Space Grotesk", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px -8px rgba(0,255,65,0.55)",
        "glow-sm": "0 0 24px -6px rgba(0,255,65,0.45)",
        card: "0 24px 60px -20px rgba(0,0,0,0.9)",
      },
      backdropBlur: {
        xs: "2px",
      },
      letterSpacing: {
        widest2: "0.28em",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "gradient-x": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        shimmer: {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(120%)" },
        },
        drift: {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(2%, -3%, 0) scale(1.08)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.45" },
          "50%": { opacity: "0.85" },
        },
        "scroll-hint": {
          "0%": { transform: "translateY(0)", opacity: "0" },
          "35%": { opacity: "1" },
          "100%": { transform: "translateY(14px)", opacity: "0" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "gradient-x": "gradient-x 12s ease infinite",
        shimmer: "shimmer 2.4s ease-in-out infinite",
        drift: "drift 26s ease-in-out infinite",
        "pulse-glow": "pulse-glow 7s ease-in-out infinite",
        "scroll-hint": "scroll-hint 2s ease-in-out infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};