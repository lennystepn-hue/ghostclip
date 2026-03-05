import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ghost: {
          50: "#f0f4ff", 100: "#dbe4ff", 200: "#bac8ff", 300: "#91a7ff",
          400: "#748ffc", 500: "#5c7cfa", 600: "#4c6ef5", 700: "#4263eb",
          800: "#3b5bdb", 900: "#364fc7", 950: "#1e3a8a",
        },
        surface: {
          DEFAULT: "#0f0f14", 50: "#f8f9fa", 100: "#1a1a24", 200: "#22222e",
          300: "#2a2a38", 400: "#333344", 500: "#3d3d50", 600: "#4a4a60",
          700: "#5c5c75", 800: "#8888a0", 900: "#aaaac0",
        },
        accent: {
          purple: "#a855f7", pink: "#ec4899", cyan: "#06b6d4",
          green: "#22c55e", orange: "#f97316", red: "#ef4444",
        },
      },
      backgroundImage: {
        "glass": "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
        "glass-hover": "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)",
      },
      boxShadow: {
        "glass": "0 4px 30px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
        "glass-lg": "0 8px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
        "glow": "0 0 20px rgba(92, 124, 250, 0.3)",
      },
    },
  },
  plugins: [],
};
export default config;
