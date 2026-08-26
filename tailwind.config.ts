import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic theme tokens (Dark & Light mode via CSS variables)
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",

        // Brand colors (matching PPTX design)
        brand: {
          primary: "#0F172A",   // slate-900, headers/text
          secondary: "#0EA5E9", // sky-500, blue accent
          accent: "#F97316",    // orange-500, highlights
        },
        // Score tier colors
        score: {
          gold: "#FFB800",      // 80-100 hot leads
          cyan: "#00D9FF",      // 60-79 warm
          green: "#00FF88",     // converted
          red: "#FF4500",       // dead/churn
        },
        // Backgrounds
        surface: {
          base: "#060919",
          card: "rgba(13, 19, 44, 0.78)",
          hover: "rgba(22, 32, 72, 0.9)",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        display: ["Outfit", "Inter", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "slide-in": "slideIn 0.3s ease",
      },
      keyframes: {
        slideIn: {
          from: { transform: "translateY(20px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
      },
      backgroundImage: {
        "gradient-brand":
          "linear-gradient(135deg, #0EA5E9 0%, #8B5CF6 100%)",
        "gradient-accent":
          "linear-gradient(135deg, #F97316 0%, #CC3700 100%)",
        "gradient-radial":
          "radial-gradient(circle at 15% 10%, #121A42 0%, #060919 65%)",
      },
    },
  },
  plugins: [],
};

export default config;
