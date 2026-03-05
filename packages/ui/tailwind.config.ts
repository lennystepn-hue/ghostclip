import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ghost: {
          50: "#f0f4ff",
          100: "#dbe4ff",
          200: "#bac8ff",
          300: "#91a7ff",
          400: "#748ffc",
          500: "#5c7cfa",
          600: "#4c6ef5",
          700: "#4263eb",
          800: "#3b5bdb",
          900: "#364fc7",
          950: "#1e3a8a",
        },
        surface: {
          DEFAULT: "#0f0f14",
          50: "#f8f9fa",
          100: "#1a1a24",
          200: "#22222e",
          300: "#2a2a38",
          400: "#333344",
          500: "#3d3d50",
          600: "#4a4a60",
          700: "#5c5c75",
          800: "#8888a0",
          900: "#aaaac0",
        },
        accent: {
          purple: "#a855f7",
          pink: "#ec4899",
          cyan: "#06b6d4",
          green: "#22c55e",
          orange: "#f97316",
          red: "#ef4444",
        },
      },
      backgroundImage: {
        "glass": "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
        "glass-hover": "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)",
        "glow-purple": "radial-gradient(ellipse at center, rgba(168,85,247,0.15) 0%, transparent 70%)",
        "glow-blue": "radial-gradient(ellipse at center, rgba(92,124,250,0.15) 0%, transparent 70%)",
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        "glass": "0 4px 30px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
        "glass-lg": "0 8px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
        "glow": "0 0 20px rgba(92, 124, 250, 0.3)",
        "glow-lg": "0 0 40px rgba(92, 124, 250, 0.4)",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(92, 124, 250, 0.2)" },
          "50%": { boxShadow: "0 0 40px rgba(92, 124, 250, 0.4)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
