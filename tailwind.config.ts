import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0F172A",
        teal: {
          DEFAULT: "#14B8A6",
          glow: "#38E1D1",
        },
        amber: "#FBBF24",
        lavender: {
          DEFAULT: "#A78BFA",
          deep: "#7C5CFC",
        },
        sky: "#38BDF8",
        bone: "#F5F5F4",
        surface: {
          light: "#FFFFFF",
          "light-2": "#F8F7FB",
          dark: "#181534",
          "dark-2": "#241F48",
        },
        canvas: {
          light: "#F8F7FE",
          dark: "#1C1A3D",
        },
        sidebar: {
          dark: "#201C48",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      borderRadius: {
        xl2: "1.25rem",
        xl3: "1.75rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.06)",
        "card-dark": "0 1px 2px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.35)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
      animation: {
        float: "float 4s ease-in-out infinite",
        "pulse-soft": "pulse-soft 2.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
