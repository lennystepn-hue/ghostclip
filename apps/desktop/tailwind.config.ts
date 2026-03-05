import baseConfig from "@ghostclip/ui/tailwind.config";
import type { Config } from "tailwindcss";

const config: Config = {
  ...baseConfig,
  content: [
    "./src/renderer/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
};

export default config;
